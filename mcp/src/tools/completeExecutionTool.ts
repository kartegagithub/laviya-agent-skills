import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { completeExecution, completeExecutionPayloadSchema } from "../orchestration/completeExecution.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";

export interface CompleteExecutionToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  runtimeConfig: RuntimeConfig;
  leaseManager: LeaseManager;
  logger: Logger;
}

export function registerCompleteExecutionTool(deps: CompleteExecutionToolDeps): void {
  deps.server.registerTool(
    "laviya_complete_execution",
    {
      title: "Complete Execution",
      description:
        "Complete the active execution with structured summary, optional generated tasks/wikis, and deterministic idempotency handling.",
      inputSchema: {
        payload: completeExecutionPayloadSchema
      }
    },
    async (input) => {
      try {
        const payload = completeExecutionPayloadSchema.parse(input.payload);
        const result = await completeExecution(deps.client, deps.runtimeConfig, deps.logger, payload);
        deps.leaseManager.stop();

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_complete_execution failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}
