import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
import type { CanonicalizationResult } from "../adapters/resultAdapter.js";
export declare const completeExecutionPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    aiAgentFlowRunID: z.ZodNumber;
    aiAgentTaskExecutionID: z.ZodNumber;
    requestKey: z.ZodOptional<z.ZodString>;
    finalOutput: z.ZodString;
    agentType: z.ZodOptional<z.ZodString>;
    agentVersion: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type CompleteExecutionPayload = z.infer<typeof completeExecutionPayloadSchema>;
export interface PreparedCompletion {
    payload: CompleteExecutionPayload;
    canonicalization?: CanonicalizationResult;
    processingError?: string;
}
export declare function prepareCompletion(payload: CompleteExecutionPayload): PreparedCompletion;
export declare function completeExecution(client: LaviyaApiClient, _runtimeConfig: RuntimeConfig, logger: Logger, payload: CompleteExecutionPayload, prepared?: PreparedCompletion): Promise<unknown>;
//# sourceMappingURL=completeExecution.d.ts.map