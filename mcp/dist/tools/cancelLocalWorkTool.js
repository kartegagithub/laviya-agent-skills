import { cancelLocalWork, cancelLocalWorkPayloadSchema } from "../orchestration/cancelLocalWork.js";
export function registerCancelLocalWorkTool(deps) {
    deps.server.registerTool("laviya_cancel_local_work", {
        title: "Cancel Local Work",
        description: "Cancel an active local-direct run and its active execution leases.",
        inputSchema: {
            payload: cancelLocalWorkPayloadSchema
        }
    }, async (input) => {
        try {
            const payload = cancelLocalWorkPayloadSchema.parse(input.payload);
            const result = await cancelLocalWork(deps.client, deps.logger, payload);
            return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            deps.logger.error("laviya_cancel_local_work failed", {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    });
}
//# sourceMappingURL=cancelLocalWorkTool.js.map