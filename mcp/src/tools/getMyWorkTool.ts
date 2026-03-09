import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { getMyWork, getMyWorkInputSchema } from "../orchestration/getMyWork.js";
import type { Logger } from "../utils/logger.js";

export interface GetMyWorkToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  runtimeConfig: RuntimeConfig;
  logger: Logger;
}

const getMyWorkToolInputSchema = getMyWorkInputSchema.extend({
  output: z
    .object({
      minify: z.boolean().default(true),
      omitFields: z.array(z.string().min(1)).default([])
    })
    .optional()
});

export function registerGetMyWorkTool(deps: GetMyWorkToolDeps): void {
  deps.server.registerTool(
    "laviya_get_my_work",
    {
      title: "Get My Work",
      description:
        "Get the next eligible Laviya orchestration work item. Supports lite payload controls, run pinning, project defaults, and minified/filtered output shaping.",
      inputSchema: {
        runId: getMyWorkToolInputSchema.shape.runId,
        projectId: getMyWorkToolInputSchema.shape.projectId,
        includeFileBytes: getMyWorkToolInputSchema.shape.includeFileBytes,
        previousLogsLimit: getMyWorkToolInputSchema.shape.previousLogsLimit,
        output: getMyWorkToolInputSchema.shape.output
      }
    },
    async (input) => {
      try {
        const parsed = getMyWorkToolInputSchema.parse(input);
        const output = parsed.output ?? { minify: true, omitFields: [] };
        const result = await getMyWork(deps.client, deps.runtimeConfig, deps.logger, parsed);
        const filtered = applyFieldOmissions(result, output.omitFields);
        return { content: [{ type: "text", text: serializePayload(filtered, output.minify) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_get_my_work failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}

function serializePayload(payload: unknown, minify: boolean): string {
  const serialized = minify ? JSON.stringify(payload) : JSON.stringify(payload, null, 2);
  return serialized ?? "null";
}

function applyFieldOmissions(payload: unknown, omitFields: string[]): unknown {
  if (!omitFields || omitFields.length === 0) {
    return payload;
  }

  const clone = cloneAsJson(payload);
  if (clone === null || clone === undefined) {
    return clone;
  }

  for (const rawPath of omitFields) {
    const segments = rawPath
      .split(".")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    if (segments.length === 0) {
      continue;
    }

    removePath(clone, segments);
  }

  return clone;
}

function cloneAsJson(payload: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return payload;
  }
}

function removePath(node: unknown, segments: string[]): void {
  if (!node || segments.length === 0) {
    return;
  }

  const segment = segments[0];
  if (!segment) {
    return;
  }
  const rest = segments.slice(1);

  if (Array.isArray(node)) {
    if (segment === "*") {
      for (const item of node) {
        removePath(item, rest);
      }
      return;
    }

    for (const item of node) {
      removePath(item, segments);
    }
    return;
  }

  if (!isRecord(node)) {
    return;
  }

  if (segment === "*") {
    for (const value of Object.values(node)) {
      removePath(value, rest);
    }
    return;
  }

  const key = findKeyCaseInsensitive(node, segment);
  if (!key) {
    return;
  }

  if (rest.length === 0) {
    delete node[key];
    return;
  }

  removePath(node[key], rest);
}

function findKeyCaseInsensitive(record: Record<string, unknown>, key: string): string | undefined {
  if (Object.prototype.hasOwnProperty.call(record, key)) {
    return key;
  }

  const target = key.toLowerCase();
  return Object.keys(record).find((candidate) => candidate.toLowerCase() === target);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
