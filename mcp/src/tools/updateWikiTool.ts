import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { updateWiki, updateWikiPayloadSchema } from "../orchestration/wikis.js";
import type { Logger } from "../utils/logger.js";

export interface UpdateWikiToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerUpdateWikiTool(deps: UpdateWikiToolDeps): void {
  deps.server.registerTool(
    "laviya_update_wiki",
    {
      title: "Update Wiki",
      description:
        "Rename a Laviya wiki and/or replace (default) or append its plain-text content, after the user approved the change. " +
        "Only wikis you can see in Laviya can be updated. Replace overwrites the whole content; append is not retried automatically.",
      inputSchema: {
        payload: updateWikiPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: mutatingToolAnnotations
    },
    async (input) =>
      executeTool("laviya_update_wiki", deps.logger, async () => {
        const payload = updateWikiPayloadSchema.parse(input.payload);
        return updateWiki(deps.client, deps.logger, payload);
      })
  );
}
