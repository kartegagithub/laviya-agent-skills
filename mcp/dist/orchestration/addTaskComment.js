import { z } from "zod";
import { fileListSchema, readTaskFile, resolveTaskFileIDs } from "./taskContent.js";
export const addTaskCommentPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    description: z.string().optional().describe("Comment text (plain text or HTML). Optional when files are given."),
    ...fileListSchema.shape
});
export async function addTaskComment(client, logger, payload, projectRoot = process.cwd()) {
    if (!payload.description?.trim() && !payload.filePaths?.length && !payload.fileIDs?.length) {
        throw new Error("Pass description, filePaths or fileIDs.");
    }
    for (const filePath of payload.filePaths ?? []) {
        await readTaskFile(projectRoot, filePath);
    }
    const fileIDs = await resolveTaskFileIDs(client, logger, projectRoot, payload.taskID, payload);
    logger.info("Adding task comment for self-managed agent work", {
        taskID: payload.taskID,
        descriptionLength: payload.description?.length ?? 0,
        fileCount: fileIDs.length
    });
    return client.addTaskComment({
        taskID: payload.taskID,
        description: payload.description,
        fileIDs: fileIDs.length > 0 ? fileIDs : undefined
    });
}
//# sourceMappingURL=addTaskComment.js.map