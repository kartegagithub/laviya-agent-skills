import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export const feedTaskPayloadSchema = z.object({
  taskID: z.number().int().positive()
}).strict();

export type FeedTaskPayload = z.infer<typeof feedTaskPayloadSchema>;

export async function feedTask(client: LaviyaApiClient, logger: Logger, payload: FeedTaskPayload): Promise<unknown> {
  logger.info("Feeding task into local-direct orchestration", {
    taskID: payload.taskID
  });

  return client.feedTask(payload);
}
