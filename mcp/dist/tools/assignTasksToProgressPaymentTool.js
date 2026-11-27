import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { assignTasksToProgressPayment, assignTasksToProgressPaymentPayloadSchema } from "../orchestration/progressPayments.js";
export function registerAssignTasksToProgressPaymentTool(deps) {
    deps.server.registerTool("laviya_assign_tasks_to_progress_payment", {
        title: "Assign Tasks To Progress Payment",
        description: "Assign existing tasks to a progress payment (hakediş), or clear it from them with remove: true, after the user approved it. A task has one " +
            "progress payment, so assigning moves it from its previous one. All tasks must belong to the progress payment's project; otherwise nothing " +
            "is changed. Returns per task assigned, alreadyAssigned, removed or notPresent, so repeating the call is harmless. The change is written to the task history. " +
            "A progress payment that is in the past, not started yet or invoiced is rejected first: tell the user why and resend with confirmInactiveProgressPayment: true only if they explicitly confirm.",
        inputSchema: {
            payload: assignTasksToProgressPaymentPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_assign_tasks_to_progress_payment", deps.logger, async () => {
        const payload = assignTasksToProgressPaymentPayloadSchema.parse(input.payload);
        return assignTasksToProgressPayment(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=assignTasksToProgressPaymentTool.js.map