import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { updateTaskTags, updateTaskTagsPayloadSchema } from "../orchestration/taskTags.js";
import type { Logger } from "../utils/logger.js";

export interface UpdateTaskTagsToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerUpdateTaskTagsTool(deps: UpdateTaskTagsToolDeps): void {
  deps.server.registerTool(
    "laviya_update_task_tags",
    {
      title: "Update Task Tags",
      description:
        "Add tags (by name) to a task you can access, or remove them with remove: true, after the user approved it. Names match existing tags ignoring case, " +
        "spaces, '-', '_' and '.', so a quickly typed 'frontEnd' reuses 'Frontend'. An unknown name is created as a new tag, unless it looks like a typo of an " +
        "existing tag: then nothing changes and the error names that tag, so ask the user. Returns per name added, alreadyPresent, removed or notPresent " +
        "(isNewTag when the tag was created) and the task's tags; repeating the call is harmless.",
      inputSchema: {
        payload: updateTaskTagsPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_update_task_tags", deps.logger, async () => {
        const payload = updateTaskTagsPayloadSchema.parse(input.payload);
        return updateTaskTags(deps.client, deps.logger, payload);
      })
  );
}
