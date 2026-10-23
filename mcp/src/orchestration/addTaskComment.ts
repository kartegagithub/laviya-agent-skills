import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { fileListSchema, readTaskFile, resolveTaskFileIDs } from "./taskContent.js";

export const addTaskCommentPayloadSchema = z.object({
  taskID: z.number().int().positive(),
  description: z.string().optional().describe("Comment text (plain text or HTML). Optional when files are given."),
  ...fileListSchema.shape
});

export type AddTaskCommentPayload = z.infer<typeof addTaskCommentPayloadSchema>;

export async function addTaskComment(
  client: LaviyaApiClient,
  logger: Logger,
  payload: AddTaskCommentPayload,
  projectRoot: string = process.cwd()
): Promise<unknown> {
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
