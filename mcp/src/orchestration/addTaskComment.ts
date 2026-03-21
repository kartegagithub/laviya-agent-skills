import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export const addTaskCommentPayloadSchema = z.object({
  taskID: z.number().int().positive(),
  description: z.string().min(1)
});

export type AddTaskCommentPayload = z.infer<typeof addTaskCommentPayloadSchema>;

export async function addTaskComment(
  client: LaviyaApiClient,
  logger: Logger,
  payload: AddTaskCommentPayload
): Promise<unknown> {
  logger.info("Adding task comment for self-managed agent work", {
    taskID: payload.taskID,
    descriptionLength: payload.description.length
  });

  return client.addTaskComment(payload);
}
