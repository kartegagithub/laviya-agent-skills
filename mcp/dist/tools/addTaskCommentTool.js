import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { addTaskComment, addTaskCommentPayloadSchema } from "../orchestration/addTaskComment.js";
export function registerAddTaskCommentTool(deps) {
    deps.server.registerTool("laviya_add_task_comment", {
        title: "Add Task Comment",
        description: "Append self-managed agent work output to a task as a comment. Images in filePaths/fileIDs are shown inline in the comment, other files as links (files are also added to the task attachments).",
        inputSchema: {
            payload: addTaskCommentPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: mutatingToolAnnotations
    }, async (input) => executeTool("laviya_add_task_comment", deps.logger, async () => {
        const payload = addTaskCommentPayloadSchema.parse(input.payload);
        return addTaskComment(deps.client, deps.logger, payload, deps.projectRoot);
    }));
}
//# sourceMappingURL=addTaskCommentTool.js.map