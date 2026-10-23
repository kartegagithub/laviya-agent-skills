import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { assignTask, assignTaskPayloadSchema } from "../orchestration/taskContent.js";
export function registerAssignTaskTool(deps) {
    deps.server.registerTool("laviya_assign_task", {
        title: "Assign Task",
        description: "Assign a Laviya task. Without assigneeEmails the task is assigned to you. Only users with PM permission (PM, Director or Admin) " +
            "can assign other people; for others the call is rejected.",
        inputSchema: {
            payload: assignTaskPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_assign_task", deps.logger, async () => {
        const payload = assignTaskPayloadSchema.parse(input.payload);
        return assignTask(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=assignTaskTool.js.map