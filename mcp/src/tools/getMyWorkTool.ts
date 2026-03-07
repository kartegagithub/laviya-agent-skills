import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import { getMyWork, getMyWorkInputSchema } from "../orchestration/getMyWork.js";
import type { Logger } from "../utils/logger.js";

export interface GetMyWorkToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  runtimeConfig: RuntimeConfig;
  logger: Logger;
}

export function registerGetMyWorkTool(deps: GetMyWorkToolDeps): void {
  deps.server.registerTool(
    "laviya_get_my_work",
    {
      title: "Get My Work",
      description:
        "Get the next eligible Laviya orchestration work item. Supports run pinning and project-level defaults.",
      inputSchema: {
        runId: getMyWorkInputSchema.shape.runId,
        projectId: getMyWorkInputSchema.shape.projectId
      }
    },
    async (input) => {
      try {
        const parsed = getMyWorkInputSchema.parse(input);
        const result = await getMyWork(deps.client, deps.runtimeConfig, deps.logger, parsed);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_get_my_work failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}
