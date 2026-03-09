import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { feedTask, feedTaskPayloadSchema } from "../orchestration/feedTask.js";
import type { Logger } from "../utils/logger.js";

export interface FeedTaskToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerFeedTaskTool(deps: FeedTaskToolDeps): void {
  deps.server.registerTool(
    "laviya_feed_task",
    {
      title: "Feed Task",
      description:
        "Feed a task into local-direct AI execution mode. Backend creates or reuses a hidden single-step flow run for the task.",
      inputSchema: {
        payload: feedTaskPayloadSchema
      }
    },
    async (input) => {
      try {
        const payload = feedTaskPayloadSchema.parse(input.payload);
        const result = await feedTask(deps.client, deps.logger, payload);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error: unknown) {
        deps.logger.error("laviya_feed_task failed", {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    }
  );
}
