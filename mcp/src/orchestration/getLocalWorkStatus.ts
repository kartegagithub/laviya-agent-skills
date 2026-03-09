import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export const getLocalWorkStatusInputSchema = z.object({
  runId: z.number().int().positive()
});

export type GetLocalWorkStatusInput = z.infer<typeof getLocalWorkStatusInputSchema>;

export async function getLocalWorkStatus(
  client: LaviyaApiClient,
  logger: Logger,
  input: GetLocalWorkStatusInput
): Promise<unknown> {
  logger.info("Getting local work status", {
    runId: input.runId
  });

  return client.getLocalWorkStatus({
    runId: input.runId
  });
}
