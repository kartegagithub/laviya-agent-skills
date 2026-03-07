import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const reportTokenUsagePayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    aiAgentFlowRunID: z.ZodNumber;
    aiAgentTaskExecutionID: z.ZodOptional<z.ZodNumber>;
    tokenUsages: z.ZodArray<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        inputTokens?: number | undefined;
        outputTokens?: number | undefined;
        totalTokens?: number | undefined;
        cost?: number | undefined;
        currency?: string | undefined;
        providerRequestID?: string | undefined;
    }, {
        model?: string | undefined;
        inputTokens?: number | undefined;
        outputTokens?: number | undefined;
        totalTokens?: number | undefined;
        cost?: number | undefined;
        currency?: string | undefined;
        providerRequestID?: string | undefined;
    }>, "many">;
    requestKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    taskID: number;
    aiAgentFlowRunID: number;
    tokenUsages: {
        model?: string | undefined;
        inputTokens?: number | undefined;
        outputTokens?: number | undefined;
        totalTokens?: number | undefined;
        cost?: number | undefined;
        currency?: string | undefined;
        providerRequestID?: string | undefined;
    }[];
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
}, {
    taskID: number;
    aiAgentFlowRunID: number;
    tokenUsages: {
        model?: string | undefined;
        inputTokens?: number | undefined;
        outputTokens?: number | undefined;
        totalTokens?: number | undefined;
        cost?: number | undefined;
        currency?: string | undefined;
        providerRequestID?: string | undefined;
    }[];
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
}>;
export type ReportTokenUsagePayload = z.infer<typeof reportTokenUsagePayloadSchema>;
export declare function reportTokenUsage(client: LaviyaApiClient, logger: Logger, payload: ReportTokenUsagePayload): Promise<unknown>;
//# sourceMappingURL=reportTokenUsage.d.ts.map