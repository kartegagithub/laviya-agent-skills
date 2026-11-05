import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listWikis, listWikisInputSchema } from "../orchestration/wikis.js";
import type { Logger } from "../utils/logger.js";

export interface ListWikisToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerListWikisTool(deps: ListWikisToolDeps): void {
  deps.server.registerTool(
    "laviya_list_wikis",
    {
      title: "List Wikis",
      description:
        "List the wikis of a project you can access (projectID, or project by name or task prefix) as a flat tree (id, name, parentWikiID, sortOrder, childCount, dateModified; max 500), " +
        "optionally filtered by name or parent. Only wikis your Laviya permissions let you see are listed. Read-only. " +
        "Use the id with laviya_get_wiki, laviya_update_wiki or as parentWikiID of laviya_create_wiki.",
      inputSchema: {
        projectID: listWikisInputSchema.shape.projectID,
        project: listWikisInputSchema.shape.project,
        search: listWikisInputSchema.shape.search,
        parentWikiID: listWikisInputSchema.shape.parentWikiID
      },
      outputSchema: toolResultOutputSchema,
      annotations: readOnlyToolAnnotations
    },
    async (input) =>
      executeTool("laviya_list_wikis", deps.logger, async () => {
        const parsed = listWikisInputSchema.parse(input);
        return listWikis(deps.client, deps.logger, parsed);
      })
  );
}
