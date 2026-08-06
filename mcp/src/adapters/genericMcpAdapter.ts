import { canonicalResultSchema } from "../contracts/canonicalResult.js";
import type { CanonicalizationResult, ResultAdapter, ResultAdapterContext } from "./resultAdapter.js";

const RESULT_START = "<LAVIYA_RESULT>";
const RESULT_END = "</LAVIYA_RESULT>";

export class GenericMcpResultAdapter implements ResultAdapter {
  readonly name: string = "generic-mcp";
  readonly version: string = "1.0.0";

  canHandle(_context: ResultAdapterContext): boolean {
    return true;
  }

  canonicalize(rawOutput: string, _context: ResultAdapterContext): CanonicalizationResult {
    if (!rawOutput || !rawOutput.trim()) {
      throw new Error("E_RESULT_EMPTY: Final output cannot be empty.");
    }

    const repairs: string[] = [];
    const extracted = extractSingleResult(rawOutput, repairs);
    let parsed: unknown;
    try {
      parsed = JSON.parse(extracted);
    } catch (error: unknown) {
      throw new Error(`E_RESULT_JSON_INVALID: ${error instanceof Error ? error.message : String(error)}`);
    }

    const normalized = normalizeDeterministically(parsed, repairs);
    const validated = canonicalResultSchema.safeParse(normalized);
    if (!validated.success) {
      const details = validated.error.issues
        .map((issue) => `${issue.path.join(".") || "$"}: ${issue.message}`)
        .join("; ");
      throw new Error(`E_RESULT_SCHEMA_INVALID: ${details}`);
    }

    return {
      canonicalResult: validated.data,
      adapterName: this.name,
      adapterVersion: this.version,
      repairs
    };
  }
}

function extractSingleResult(rawOutput: string, repairs: string[]): string {
  const trimmed = rawOutput.trim();
  const blocks: string[] = [];
  let cursor = 0;
  while (cursor < trimmed.length) {
    const start = trimmed.indexOf(RESULT_START, cursor);
    if (start < 0) break;
    const contentStart = start + RESULT_START.length;
    const end = trimmed.indexOf(RESULT_END, contentStart);
    if (end < 0) {
      throw new Error("E_RESULT_BLOCK_UNCLOSED: LAVIYA_RESULT block is not closed.");
    }
    blocks.push(trimmed.slice(contentStart, end).trim());
    cursor = end + RESULT_END.length;
  }

  if (blocks.length > 1) {
    throw new Error("E_RESULT_MULTIPLE_BLOCKS: Exactly one LAVIYA_RESULT block is allowed.");
  }
  if (blocks.length === 1) {
    repairs.push("extracted_laviya_result_block");
    return stripCodeFence(blocks[0]!, repairs);
  }

  return stripCodeFence(trimmed, repairs);
}

function stripCodeFence(value: string, repairs: string[]): string {
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(value);
  if (!match) return value;
  repairs.push("removed_markdown_code_fence");
  return match[1]!.trim();
}

function normalizeDeterministically(value: unknown, repairs: string[]): unknown {
  if (!isRecord(value)) return value;
  const result = { ...value };

  rename(result, "contract_version", "contractVersion", repairs);
  rename(result, "output_type", "outputType", repairs);
  rename(result, "agent_status", "agentReportedStatus", repairs);
  rename(result, "agentNotes", "agentNotes", repairs);

  if (typeof result.contractVersion === "number" && result.contractVersion === 1) {
    result.contractVersion = "1.0";
    repairs.push("normalized_contract_version");
  }

  if (typeof result.agentReportedStatus === "string") {
    const normalized = result.agentReportedStatus.trim().toLowerCase();
    const mapped = ["done", "success", "finished", "complete"].includes(normalized)
      ? "completed"
      : ["fail", "error"].includes(normalized)
        ? "failed"
        : normalized;
    if (mapped !== result.agentReportedStatus) {
      result.agentReportedStatus = mapped;
      repairs.push("normalized_agent_reported_status");
    }
  }

  for (const field of ["attachments", "agentNotes"] as const) {
    if (result[field] === null || result[field] === undefined) {
      result[field] = [];
      repairs.push(`defaulted_${field}`);
    } else if (typeof result[field] === "string") {
      result[field] = [result[field]];
      repairs.push(`converted_${field}_to_array`);
    }
  }

  return result;
}

function rename(record: Record<string, unknown>, from: string, to: string, repairs: string[]): void {
  if (from === to || !(from in record) || to in record) return;
  record[to] = record[from];
  delete record[from];
  repairs.push(`renamed_${from}_to_${to}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
