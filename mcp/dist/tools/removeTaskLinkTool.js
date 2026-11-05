import { executeTool } from "../mcp/result.js";
import { destructiveMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { removeTaskLink, removeTaskLinkPayloadSchema } from "../orchestration/taskLinks.js";
export function registerRemoveTaskLinkTool(deps) {
    deps.server.registerTool("laviya_remove_task_link", {
        title: "Remove Task Link",
        description: "Remove a link from a task after the user approved it. The link must belong to taskID; only its creator, the project PM or an Admin can remove it. " +
            "Removing a link that is already removed returns true.",
        inputSchema: {
            payload: removeTaskLinkPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: destructiveMutationAnnotations
    }, async (input) => executeTool("laviya_remove_task_link", deps.logger, async () => {
        const payload = removeTaskLinkPayloadSchema.parse(input.payload);
        return removeTaskLink(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=removeTaskLinkTool.js.map