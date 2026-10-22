import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { startTaskWork, startTaskWorkPayloadSchema } from "../orchestration/taskWork.js";
import type { Logger } from "../utils/logger.js";

export interface StartTaskWorkToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerStartTaskWorkTool(deps: StartTaskWorkToolDeps): void {
  deps.server.registerTool(
    "laviya_start_task_work",
    {
      title: "Start Task Work",
      description:
        "Outside orchestration, start the server-measured AI working time on a Laviya task right before implementing it. " +
        "Moves the task to the project's Processing status. Calling it again returns the open session and keeps the first start time.",
      inputSchema: {
        payload: startTaskWorkPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_start_task_work", deps.logger, async () => {
        const payload = startTaskWorkPayloadSchema.parse(input.payload);
        return startTaskWork(deps.client, deps.logger, payload);
      })
  );
}
