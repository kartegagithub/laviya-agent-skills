import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export const feedTaskPayloadSchema = z.object({
  taskID: z.number().int().positive(),
  userRequest: z.string().optional(),
  agentUID: z.string().min(1).optional(),
  cancelActiveRun: z.boolean().default(false),
  requestKey: z.string().min(1).optional(),
  attachmentFileIDs: z.array(z.number().int().positive()).optional()
});

export type FeedTaskPayload = z.infer<typeof feedTaskPayloadSchema>;

export async function feedTask(client: LaviyaApiClient, logger: Logger, payload: FeedTaskPayload): Promise<unknown> {
  logger.info("Feeding task into local-direct orchestration", {
    taskID: payload.taskID,
    cancelActiveRun: payload.cancelActiveRun,
    hasAgentUID: !!payload.agentUID
  });

  return client.feedTask(payload);
}
