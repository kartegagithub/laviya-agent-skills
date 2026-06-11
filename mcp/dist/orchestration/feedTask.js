import { z } from "zod";
export const feedTaskPayloadSchema = z.object({
    taskID: z.number().int().positive()
}).strict();
export async function feedTask(client, logger, payload) {
    logger.info("Feeding task into local-direct orchestration", {
        taskID: payload.taskID
    });
    return client.feedTask(payload);
}
//# sourceMappingURL=feedTask.js.map