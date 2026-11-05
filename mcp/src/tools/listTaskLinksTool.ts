import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listTaskLinks, listTaskLinksPayloadSchema } from "../orchestration/taskLinks.js";
import type { Logger } from "../utils/logger.js";

export interface ListTaskLinksToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerListTaskLinksTool(deps: ListTaskLinksToolDeps): void {
  deps.server.registerTool(
    "laviya_list_task_links",
    {
      title: "List Task Links",
      description:
        "List the links of a task you can access (the Links area of the task detail: Figma, Visily, GitHub and other pages) with id, provider, " +
        "linkType, url, embedUrl, title, state, preview metadata and canRemove. Read-only.",
      inputSchema: {
        payload: listTaskLinksPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: readOnlyToolAnnotations
    },
    async (input) =>
      executeTool("laviya_list_task_links", deps.logger, async () => {
        const payload = listTaskLinksPayloadSchema.parse(input.payload);
        return listTaskLinks(deps.client, deps.logger, payload);
      })
  );
}
