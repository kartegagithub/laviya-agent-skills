import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export const startExecutionInputSchema = z.object({
  runId: z.number().int().positive(),
  taskId: z.number().int().positive(),
  executionId: z.number().int().positive().optional()
});

export type StartExecutionInput = z.infer<typeof startExecutionInputSchema>;

export async function startExecution(
  client: LaviyaApiClient,
  logger: Logger,
  input: StartExecutionInput
): Promise<unknown> {
  logger.info("Starting execution lease", {
    runId: input.runId,
    taskId: input.taskId,
    executionId: input.executionId
  });

  return client.startExecution(input);
}
