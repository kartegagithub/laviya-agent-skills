import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { completeTaskWork, completeTaskWorkPayloadSchema } from "../orchestration/taskWork.js";
export function registerCompleteTaskWorkTool(deps) {
    deps.server.registerTool("laviya_complete_task_work", {
        title: "Complete Task Work",
        description: "Outside orchestration, finish the work started with laviya_start_task_work: Laviya records the measured time as AI effort, " +
            "moves the task to Ready for deploy (or targetStatus) and adds the completion comment. Safe to retry for the same sessionID: steps already done are not repeated.",
        inputSchema: {
            payload: completeTaskWorkPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_complete_task_work", deps.logger, async () => {
        const payload = completeTaskWorkPayloadSchema.parse(input.payload);
        return completeTaskWork(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=completeTaskWorkTool.js.map