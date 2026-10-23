import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { startDeliveryRun, startDeliveryRunPayloadSchema } from "../orchestration/taskWork.js";
export function registerStartDeliveryRunTool(deps) {
    deps.server.registerTool("laviya_start_delivery_run", {
        title: "Start Delivery Run",
        description: "Outside orchestration, group existing Laviya tasks into a delivery run before working on them. Reuses your active run that already " +
            "contains any of the tasks (adding the missing ones), otherwise creates a run. Pass the returned id as deliveryRunID to laviya_start_task_work.",
        inputSchema: {
            payload: startDeliveryRunPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_start_delivery_run", deps.logger, async () => {
        const payload = startDeliveryRunPayloadSchema.parse(input.payload);
        return startDeliveryRun(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=startDeliveryRunTool.js.map