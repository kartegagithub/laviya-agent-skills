import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import { startExecution, startExecutionInputSchema } from "../orchestration/startExecution.js";
import type { Logger } from "../utils/logger.js";

export interface StartExecutionToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  leaseManager: LeaseManager;
  logger: Logger;
}

export function registerStartExecutionTool(deps: StartExecutionToolDeps): void {
  deps.server.registerTool(
    "laviya_start_execution",
    {
      title: "Start Execution",
      description:
        "Start an execution lease in Laviya for the active work item. Also starts local lease refresh management.",
      inputSchema: {
        runId: startExecutionInputSchema.shape.runId,
        taskId: startExecutionInputSchema.shape.taskId,
        executionId: startExecutionInputSchema.shape.executionId
      }
    },
    async (input) => {
      try {
        const parsed = startExecutionInputSchema.parse(input);
        const result = await startExecution(deps.client, deps.logger, parsed);
        deps.leaseManager.start(parsed);

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_start_execution failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}
