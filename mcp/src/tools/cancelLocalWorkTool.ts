import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import {
  destructiveMutationAnnotations,
  toolResultOutputSchema
} from "../mcp/toolMetadata.js";
import { cancelLocalWork, cancelLocalWorkPayloadSchema } from "../orchestration/cancelLocalWork.js";
import { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";

export interface CancelLocalWorkToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  leaseManager: LeaseManager;
  logger: Logger;
}

export function registerCancelLocalWorkTool(deps: CancelLocalWorkToolDeps): void {
  deps.server.registerTool(
    "laviya_cancel_local_work",
    {
      title: "Cancel Local Work",
      description: "Cancel an active local-direct run and its active execution leases.",
      inputSchema: {
        payload: cancelLocalWorkPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: destructiveMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_cancel_local_work", deps.logger, async () => {
        const payload = cancelLocalWorkPayloadSchema.parse(input.payload);
        const result = await cancelLocalWork(deps.client, deps.logger, payload);
        deps.leaseManager.stopByRun(payload.runID);
        return result;
      })
  );
}
