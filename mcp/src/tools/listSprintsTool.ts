import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listSprints, listSprintsInputSchema } from "../orchestration/sprints.js";
import type { Logger } from "../utils/logger.js";

export interface ListSprintsToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerListSprintsTool(deps: ListSprintsToolDeps): void {
  deps.server.registerTool(
    "laviya_list_sprints",
    {
      title: "List Sprints",
      description:
        "List the sprints (Laviya folders) of a project you can access, with id, name, startDate, endDate, sortOrder and taskCount, " +
        "optionally filtered by name. Use the id as folderID in laviya_create_tasks or laviya_assign_tasks_to_sprint.",
      inputSchema: {
        projectID: listSprintsInputSchema.shape.projectID,
        search: listSprintsInputSchema.shape.search
      },
      outputSchema: toolResultOutputSchema,
      annotations: readOnlyToolAnnotations
    },
    async (input) =>
      executeTool("laviya_list_sprints", deps.logger, async () => {
        const parsed = listSprintsInputSchema.parse(input);
        return listSprints(deps.client, deps.logger, parsed);
      })
  );
}
