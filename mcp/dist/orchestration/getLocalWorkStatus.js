import { z } from "zod";
export const getLocalWorkStatusInputSchema = z.object({
    runId: z.number().int().positive()
});
export async function getLocalWorkStatus(client, logger, input) {
    logger.info("Getting local work status", {
        runId: input.runId
    });
    return client.getLocalWorkStatus({
        runId: input.runId
    });
}
//# sourceMappingURL=getLocalWorkStatus.js.map