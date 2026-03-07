import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
import { generateDeterministicRequestKey } from "../utils/requestKey.js";

const tokenUsageSchema = z.object({
  model: z.string().min(1).optional(),
  inputTokens: z.number().int().min(0).optional(),
  outputTokens: z.number().int().min(0).optional(),
  totalTokens: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  currency: z.string().min(1).optional(),
  providerRequestID: z.string().optional()
});

export const reportTokenUsagePayloadSchema = z.object({
  taskID: z.number().int().positive(),
  aiAgentFlowRunID: z.number().int().positive(),
  aiAgentTaskExecutionID: z.number().int().positive().optional(),
  tokenUsages: z.array(tokenUsageSchema).min(1),
  requestKey: z.string().min(1).optional()
});

export type ReportTokenUsagePayload = z.infer<typeof reportTokenUsagePayloadSchema>;

export async function reportTokenUsage(
  client: LaviyaApiClient,
  logger: Logger,
  payload: ReportTokenUsagePayload
): Promise<unknown> {
  const requestKey =
    payload.requestKey ??
    generateDeterministicRequestKey([
      payload.aiAgentFlowRunID,
      payload.taskID,
      payload.aiAgentTaskExecutionID,
      JSON.stringify(payload.tokenUsages)
    ]);

  logger.info("Reporting token usage", {
    runID: payload.aiAgentFlowRunID,
    taskID: payload.taskID,
    count: payload.tokenUsages.length
  });

  return client.reportTokenUsage(payload, requestKey);
}
