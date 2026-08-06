import assert from "node:assert/strict";
import test from "node:test";
import { ResultAdapterRegistry } from "../src/adapters/resultAdapterRegistry.js";

const result = {
  contractVersion: "1.0",
  outputType: "analysis_document",
  agentReportedStatus: "completed",
  payload: {
    title: "Analysis",
    summary: "Summary",
    sections: [{ title: "Finding", content: "Content" }]
  }
};

test("extracts one hybrid result block", () => {
  const raw = `Human text\n<LAVIYA_RESULT>\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\`\n</LAVIYA_RESULT>`;
  const parsed = new ResultAdapterRegistry().canonicalize(raw, { agentType: "codex" });
  assert.equal(parsed.adapterName, "codex");
  assert.deepEqual(parsed.repairs, ["extracted_laviya_result_block", "removed_markdown_code_fence", "defaulted_attachments", "defaulted_agentNotes"]);
});

test("repairs supported aliases deterministically", () => {
  const aliased = {
    contract_version: 1,
    output_type: "analysis_document",
    agent_status: "done",
    payload: result.payload,
    attachments: null,
    agentNotes: "note"
  };
  const first = new ResultAdapterRegistry().canonicalize(JSON.stringify(aliased));
  const second = new ResultAdapterRegistry().canonicalize(JSON.stringify(aliased));
  assert.deepEqual(first, second);
  assert.equal(first.canonicalResult.agentReportedStatus, "completed");
  assert.deepEqual(first.canonicalResult.agentNotes, ["note"]);
});

test("rejects multiple blocks and invalid schema", () => {
  const block = `<LAVIYA_RESULT>${JSON.stringify(result)}</LAVIYA_RESULT>`;
  assert.throws(() => new ResultAdapterRegistry().canonicalize(`${block}${block}`), /E_RESULT_MULTIPLE_BLOCKS/);
  assert.throws(() => new ResultAdapterRegistry().canonicalize("{}"), /E_RESULT_SCHEMA_INVALID/);
});

