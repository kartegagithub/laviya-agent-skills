import { addTaskComment, addTaskCommentPayloadSchema } from "../orchestration/addTaskComment.js";
export function registerAddTaskCommentTool(deps) {
    deps.server.registerTool("laviya_add_task_comment", {
        title: "Add Task Comment",
        description: "Append self-managed agent work output to a task as a comment using only taskID and description content.",
        inputSchema: {
            payload: addTaskCommentPayloadSchema
        }
    }, async (input) => {
        try {
            const payload = addTaskCommentPayloadSchema.parse(input.payload);
            const result = await addTaskComment(deps.client, deps.logger, payload);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            deps.logger.error("laviya_add_task_comment failed", {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    });
}
//# sourceMappingURL=addTaskCommentTool.js.map