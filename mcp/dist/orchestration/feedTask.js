import { z } from "zod";
export const feedTaskPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    userRequest: z.string().optional(),
    agentUID: z.string().min(1).optional(),
    cancelActiveRun: z.boolean().default(false),
    requestKey: z.string().min(1).optional(),
    attachmentFileIDs: z.array(z.number().int().positive()).optional()
});
export async function feedTask(client, logger, payload) {
    logger.info("Feeding task into local-direct orchestration", {
        taskID: payload.taskID,
        cancelActiveRun: payload.cancelActiveRun,
        hasAgentUID: !!payload.agentUID
    });
    return client.feedTask(payload);
}
//# sourceMappingURL=feedTask.js.map