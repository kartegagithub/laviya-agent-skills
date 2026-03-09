import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";

export const getMyWorkInputSchema = z.object({
  runId: z.number().int().positive().optional(),
  projectId: z.number().int().positive().optional(),
  includeFileBytes: z.boolean().default(false),
  previousLogsLimit: z.number().int().min(0).max(200).default(20)
});

export type GetMyWorkInput = z.infer<typeof getMyWorkInputSchema>;

export async function getMyWork(
  client: LaviyaApiClient,
  runtimeConfig: RuntimeConfig,
  logger: Logger,
  input: GetMyWorkInput
): Promise<unknown> {
  const runId = input.runId ?? (runtimeConfig.runPinning.enabled ? runtimeConfig.runPinning.runId : undefined);
  const projectId = input.projectId ?? runtimeConfig.projectConfig?.projectId;
  const agentProfile = runtimeConfig.projectConfig?.agentProfile;

  logger.info("Polling work from Laviya", {
    runId,
    projectId,
    agentProfile,
    includeFileBytes: input.includeFileBytes,
    previousLogsLimit: input.previousLogsLimit,
    pollMode: runtimeConfig.pollMode
  });

  return client.getMyWork({
    runId,
    projectId,
    agentProfile,
    includeFileBytes: input.includeFileBytes,
    previousLogsLimit: input.previousLogsLimit
  });
}
