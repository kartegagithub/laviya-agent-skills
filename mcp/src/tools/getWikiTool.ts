import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { getWiki, getWikiInputSchema } from "../orchestration/wikis.js";
import type { Logger } from "../utils/logger.js";

export interface GetWikiToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerGetWikiTool(deps: GetWikiToolDeps): void {
  deps.server.registerTool(
    "laviya_get_wiki",
    {
      title: "Get Wiki",
      description:
        "Read a Laviya wiki by id: name, plain-text content, stored HTML, project, parent, visible sub wikis and mentioned tasks. " +
        "Read-only: changes nothing.",
      inputSchema: {
        payload: getWikiInputSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: readOnlyToolAnnotations
    },
    async (input) =>
      executeTool("laviya_get_wiki", deps.logger, async () => {
        const payload = getWikiInputSchema.parse(input.payload);
        return getWiki(deps.client, deps.logger, payload);
      })
  );
}
