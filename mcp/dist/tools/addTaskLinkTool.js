import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { addTaskLink, addTaskLinkPayloadSchema } from "../orchestration/taskLinks.js";
export function registerAddTaskLinkTool(deps) {
    deps.server.registerTool("laviya_add_task_link", {
        title: "Add Task Link",
        description: "Add an http(s) link (Figma frame, Visily board, GitHub PR/commit/branch, any page) to a task you can access, after the user approved it. " +
            "It appears in the task's Links area with its preview. If the task already has the link, it is returned with isExisting: true, so repeating the call is harmless.",
        inputSchema: {
            payload: addTaskLinkPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_add_task_link", deps.logger, async () => {
        const payload = addTaskLinkPayloadSchema.parse(input.payload);
        return addTaskLink(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=addTaskLinkTool.js.map