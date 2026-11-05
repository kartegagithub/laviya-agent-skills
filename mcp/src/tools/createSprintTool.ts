import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { createSprint, createSprintPayloadSchema } from "../orchestration/sprints.js";
import type { Logger } from "../utils/logger.js";

export interface CreateSprintToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerCreateSprintTool(deps: CreateSprintToolDeps): void {
  deps.server.registerTool(
    "laviya_create_sprint",
    {
      title: "Create Sprint",
      description:
        "Create a sprint (Laviya folder) with optional start and end dates in a project you can access, after the user approved it. " +
        "If the project already has an active folder with the same name (case and spaces ignored), that folder is returned unchanged with isExisting: true, " +
        "so sending the same sprint plan again never duplicates folders.",
      inputSchema: {
        payload: createSprintPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_create_sprint", deps.logger, async () => {
        const payload = createSprintPayloadSchema.parse(input.payload);
        return createSprint(deps.client, deps.logger, payload);
      })
  );
}
