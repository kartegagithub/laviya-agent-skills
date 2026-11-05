import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { assignTasksToSprint, assignTasksToSprintPayloadSchema } from "../orchestration/sprints.js";
import type { Logger } from "../utils/logger.js";

export interface AssignTasksToSprintToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerAssignTasksToSprintTool(deps: AssignTasksToSprintToolDeps): void {
  deps.server.registerTool(
    "laviya_assign_tasks_to_sprint",
    {
      title: "Assign Tasks To Sprint",
      description:
        "Add tasks to a sprint (Laviya folder), or remove them with remove: true, after the user approved it. All tasks must belong to the sprint's project; " +
        "otherwise nothing is changed. Returns per task added, alreadyPresent, removed or notPresent, so repeating the call is harmless.",
      inputSchema: {
        payload: assignTasksToSprintPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_assign_tasks_to_sprint", deps.logger, async () => {
        const payload = assignTasksToSprintPayloadSchema.parse(input.payload);
        return assignTasksToSprint(deps.client, deps.logger, payload);
      })
  );
}
