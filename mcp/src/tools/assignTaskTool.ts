import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { assignTask, assignTaskPayloadSchema } from "../orchestration/taskContent.js";
import type { Logger } from "../utils/logger.js";

export interface AssignTaskToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerAssignTaskTool(deps: AssignTaskToolDeps): void {
  deps.server.registerTool(
    "laviya_assign_task",
    {
      title: "Assign Task",
      description:
        "Assign a Laviya task. Without assigneeEmails the task is assigned to you. Only users with PM permission (PM, Director or Admin) " +
        "can assign other people; for others the call is rejected.",
      inputSchema: {
        payload: assignTaskPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_assign_task", deps.logger, async () => {
        const payload = assignTaskPayloadSchema.parse(input.payload);
        return assignTask(deps.client, deps.logger, payload);
      })
  );
}
