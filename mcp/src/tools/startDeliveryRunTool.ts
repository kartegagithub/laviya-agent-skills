import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { startDeliveryRun, startDeliveryRunPayloadSchema } from "../orchestration/taskWork.js";
import type { Logger } from "../utils/logger.js";

export interface StartDeliveryRunToolDeps {
  server: McpServer;
  client: LaviyaApiClient;
  logger: Logger;
}

export function registerStartDeliveryRunTool(deps: StartDeliveryRunToolDeps): void {
  deps.server.registerTool(
    "laviya_start_delivery_run",
    {
      title: "Start Delivery Run",
      description:
        "Outside orchestration, group existing Laviya tasks into a delivery run before working on them. Reuses your active run that already " +
        "contains any of the tasks (adding the missing ones), otherwise creates a run. Pass the returned id as deliveryRunID to laviya_start_task_work. " +
        "Call it only right before working on the tasks; creating tasks alone never needs a run.",
      inputSchema: {
        payload: startDeliveryRunPayloadSchema
      },
      outputSchema: toolResultOutputSchema,
      annotations: idempotentMutationAnnotations
    },
    async (input) =>
      executeTool("laviya_start_delivery_run", deps.logger, async () => {
        const payload = startDeliveryRunPayloadSchema.parse(input.payload);
        return startDeliveryRun(deps.client, deps.logger, payload);
      })
  );
}
