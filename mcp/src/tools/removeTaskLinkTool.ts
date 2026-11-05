import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { destructiveMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { removeTaskLink, removeTaskLinkPayloadSchema } from "../orchestration/taskLinks.js";
import type { Logger } from "../utils/logger.js";

export interface RemoveTaskLinkToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerRemoveTaskLinkTool(deps: RemoveTaskLinkToolDeps): void {
  deps.server.registerTool(
    "laviya_remove_task_link",
    {
      title: "Remove Task Link",
      description:
        "Remove a link from a task after the user approved it. The link must belong to taskID; only its creator, the project PM or an Admin can remove it. " +
        "Removing a link that is already removed returns true.",
      inputSchema: {
        payload: removeTaskLinkPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: destructiveMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_remove_task_link", deps.logger, async () => {
        const payload = removeTaskLinkPayloadSchema.parse(input.payload);
        return removeTaskLink(deps.client, deps.logger, payload);
      })
  );
}
