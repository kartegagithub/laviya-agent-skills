import { executeTool } from "../mcp/result.js";
import { destructiveMutationAnnotations, toolResultOutputSchema } from "../mcp/toolMetadata.js";
import { cancelLocalWork, cancelLocalWorkPayloadSchema } from "../orchestration/cancelLocalWork.js";
export function registerCancelLocalWorkTool(deps) {
    deps.server.registerTool("laviya_cancel_local_work", {
        title: "Cancel Local Work",
        description: "Cancel an active local-direct run and its active execution leases.",
        inputSchema: {
            payload: cancelLocalWorkPayloadSchema
        },
        outputSchema: toolResultOutputSchema,
        annotations: destructiveMutationAnnotations
    }, async (input) => executeTool("laviya_cancel_local_work", deps.logger, async () => {
        const payload = cancelLocalWorkPayloadSchema.parse(input.payload);
        const result = await cancelLocalWork(deps.client, deps.logger, payload);
        deps.leaseManager.stopByRun(payload.runID);
        return result;
    }));
}
//# sourceMappingURL=cancelLocalWorkTool.js.map