import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { listProgressPayments, listProgressPaymentsInputSchema } from "../orchestration/progressPayments.js";
export function registerListProgressPaymentsTool(deps) {
    deps.server.registerTool("laviya_list_progress_payments", {
        title: "List Progress Payments",
        description: "List the progress payments (hakediş) of a project you can access, newest first, with id, name, code, startDate, endDate, approvalStatus, " +
            "effortTrackingType, isAssignable, isInvoiced and taskCount, optionally filtered by name or code. Use the id of an isAssignable one as " +
            "progressPaymentID in laviya_create_tasks or laviya_assign_tasks_to_progress_payment.",
        inputSchema: {
            projectID: listProgressPaymentsInputSchema.shape.projectID,
            search: listProgressPaymentsInputSchema.shape.search
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_list_progress_payments", deps.logger, async () => {
        const parsed = listProgressPaymentsInputSchema.parse(input);
        return listProgressPayments(deps.client, deps.logger, parsed);
    }));
}
//# sourceMappingURL=listProgressPaymentsTool.js.map