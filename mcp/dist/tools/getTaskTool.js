import { executeTool } from "../mcp/result.js";
import { readOnlyToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { getTask, getTaskPayloadSchema } from "../orchestration/getTask.js";
export function registerGetTaskTool(deps) {
    deps.server.registerTool("laviya_get_task", {
        title: "Get Task",
        description: "Read a Laviya task by ID or code (e.g. LVY-11262): title, plain-text description, status, project, assignees, attachments, sub tasks, " +
            "latest comments and design links. Read-only: opens no run, uses no credit and changes nothing. " +
            "Set downloadAttachments to images or all to save attachments locally and open them.",
        inputSchema: {
            payload: getTaskPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: readOnlyToolAnnotations
    }, async (input) => executeTool("laviya_get_task", deps.logger, async () => {
        const payload = getTaskPayloadSchema.parse(input.payload);
        return getTask(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=getTaskTool.js.map