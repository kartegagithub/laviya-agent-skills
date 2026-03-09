import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export const cancelLocalWorkPayloadSchema = z.object({
  runID: z.number().int().positive(),
  reason: z.string().optional()
});

export type CancelLocalWorkPayload = z.infer<typeof cancelLocalWorkPayloadSchema>;

export async function cancelLocalWork(
  client: LaviyaApiClient,
  logger: Logger,
  payload: CancelLocalWorkPayload
): Promise<unknown> {
  logger.info("Cancelling local-direct work run", {
    runID: payload.runID
  });

  return client.cancelLocalWork(payload);
}
