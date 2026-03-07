import { z } from "zod";
export const getMyWorkInputSchema = z.object({
    runId: z.number().int().positive().optional(),
    projectId: z.number().int().positive().optional()
});
export async function getMyWork(client, runtimeConfig, logger, input) {
    const runId = input.runId ?? (runtimeConfig.runPinning.enabled ? runtimeConfig.runPinning.runId : undefined);
    const projectId = input.projectId ?? runtimeConfig.projectConfig?.projectId;
    const agentProfile = runtimeConfig.projectConfig?.agentProfile;
    logger.info("Polling work from Laviya", {
        runId,
        projectId,
        agentProfile,
        pollMode: runtimeConfig.pollMode
    });
    return client.getMyWork({ runId, projectId, agentProfile });
}
//# sourceMappingURL=getMyWork.js.map