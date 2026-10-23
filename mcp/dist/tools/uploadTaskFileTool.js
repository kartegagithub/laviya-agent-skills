import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { uploadTaskFile, uploadTaskFilePayloadSchema } from "../orchestration/taskContent.js";
export function registerUploadTaskFileTool(deps) {
    deps.server.registerTool("laviya_upload_task_file", {
        title: "Upload Task File",
        description: "Upload a local file (screenshot, document, log, ...) to a Laviya task's attachments. Returns fileID, url and embedHtml; " +
            "pass fileID to laviya_update_task_description or laviya_add_task_comment to show it there (images inline).",
        inputSchema: {
            payload: uploadTaskFilePayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: mutatingToolAnnotations
    }, async (input) => executeTool("laviya_upload_task_file", deps.logger, async () => {
        const payload = uploadTaskFilePayloadSchema.parse(input.payload);
        return uploadTaskFile(deps.client, deps.logger, deps.projectRoot, payload);
    }));
}
//# sourceMappingURL=uploadTaskFileTool.js.map