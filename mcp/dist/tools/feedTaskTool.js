import { executeTool } from "../mcp/result.js";
import { mutatingToolAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { feedTask, feedTaskPayloadSchema } from "../orchestration/feedTask.js";
export function registerFeedTaskTool(deps) {
    deps.server.registerTool("laviya_feed_task", {
        title: "Feed Task",
        description: "Feed a task into local-direct AI execution mode by TaskID. Backend creates or reuses a hidden single-step flow run for the task.",
        inputSchema: {
            payload: feedTaskPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: mutatingToolAnnotations
    }, async (input) => executeTool("laviya_feed_task", deps.logger, async () => {
        const payload = feedTaskPayloadSchema.parse(input.payload);
        return feedTask(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=feedTaskTool.js.map