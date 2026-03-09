import { z } from "zod";
export const cancelLocalWorkPayloadSchema = z.object({
    runID: z.number().int().positive(),
    reason: z.string().optional()
});
export async function cancelLocalWork(client, logger, payload) {
    logger.info("Cancelling local-direct work run", {
        runID: payload.runID
    });
    return client.cancelLocalWork(payload);
}
//# sourceMappingURL=cancelLocalWork.js.map