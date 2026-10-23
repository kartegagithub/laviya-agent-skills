import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { updateTaskDescription, updateTaskDescriptionPayloadSchema } from "../orchestration/taskContent.js";
import type { Logger } from "../utils/logger.js";

export interface UpdateTaskDescriptionToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
  projectRoot: string;
}

export function registerUpdateTaskDescriptionTool(deps: UpdateTaskDescriptionToolDeps): void {
  deps.server.registerTool(
    "laviya_update_task_description",
    {
      title: "Update Task Description",
      description:
        "Add plain text and files to a Laviya task's description (mode append, default) or replace it (mode replace). " +
        "Local filePaths are uploaded to the task attachments first; images are shown inline, other files as links.",
      inputSchema: {
        payload: updateTaskDescriptionPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: mutatingToolAnnotations
    },
    async (input) =>
      executeTool("laviya_update_task_description", deps.logger, async () => {
        const payload = updateTaskDescriptionPayloadSchema.parse(input.payload);
        return updateTaskDescription(deps.client, deps.logger, deps.projectRoot, payload);
      })
  );
}
