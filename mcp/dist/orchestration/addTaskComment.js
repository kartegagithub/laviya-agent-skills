import { z } from "zod";
export const addTaskCommentPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    description: z.string().min(1)
});
export async function addTaskComment(client, logger, payload) {
    logger.info("Adding task comment for self-managed agent work", {
        taskID: payload.taskID,
        descriptionLength: payload.description.length
    });
    return client.addTaskComment(payload);
}
//# sourceMappingURL=addTaskComment.js.map