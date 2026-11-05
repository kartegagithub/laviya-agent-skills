import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { createWiki, createWikiPayloadSchema } from "../orchestration/wikis.js";
import type { Logger } from "../utils/logger.js";

export interface CreateWikiToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerCreateWikiTool(deps: CreateWikiToolDeps): void {
  deps.server.registerTool(
    "laviya_create_wiki",
    {
      title: "Create Wiki",
      description:
        "Create a wiki (or, with parentWikiID, a sub wiki) in a project you can access, after the user approved its title and content. " +
        "If an active wiki with the same name (case and spaces ignored) already exists under the same parent, it is returned unchanged with isExisting: true, " +
        "so sending the same request again never duplicates wikis. Use it only when the user asks to write something to the wiki.",
      inputSchema: {
        payload: createWikiPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_create_wiki", deps.logger, async () => {
        const payload = createWikiPayloadSchema.parse(input.payload);
        return createWiki(deps.client, deps.logger, payload);
      })
  );
}
