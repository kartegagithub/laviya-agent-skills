import { executeTool } from "../mcp/result.js";
import { idempotentMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { startTaskWork, startTaskWorkPayloadSchema } from "../orchestration/taskWork.js";
export function registerStartTaskWorkTool(deps) {
    deps.server.registerTool("laviya_start_task_work", {
        title: "Start Task Work",
        description: "Outside orchestration, start the server-measured AI working time on a Laviya task right before implementing it. " +
            "Moves the task to the project's Processing status and adds it to a delivery run (deliveryRunID, else the task's active run, else a new one). " +
            "Calling it again returns the open session and keeps the first start time. A new session uses one Agent Orchestration credit.",
        inputSchema: {
            payload: startTaskWorkPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: idempotentMutationAnnotations
    }, async (input) => executeTool("laviya_start_task_work", deps.logger, async () => {
        const payload = startTaskWorkPayloadSchema.parse(input.payload);
        return startTaskWork(deps.client, deps.logger, payload);
    }));
}
//# sourceMappingURL=startTaskWorkTool.js.map