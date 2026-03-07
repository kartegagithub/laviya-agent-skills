import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
export declare const completeExecutionPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
    aiAgentFlowRunID: z.ZodNumber;
    aiAgentTaskExecutionID: z.ZodOptional<z.ZodNumber>;
    requestKey: z.ZodOptional<z.ZodString>;
    executionSummary: z.ZodString;
    errorMessage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isFailed: z.ZodBoolean;
    logs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        message?: string | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
        duration?: number | undefined;
    }, {
        message?: string | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
        duration?: number | undefined;
    }>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodObject<{
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
    }>, "many">>;
    tasks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        complexity: z.ZodNumber;
        priority: z.ZodNumber;
        taskTypeID: z.ZodEffects<z.ZodNumber, number, number>;
        estimatedEffort: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        priority: number;
        title: string;
        complexity: number;
        taskTypeID: number;
        estimatedEffort: number;
        description?: string | undefined;
    }, {
        priority: number;
        title: string;
        complexity: number;
        taskTypeID: number;
        estimatedEffort: number;
        description?: string | undefined;
    }>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
    }>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    taskID: number;
    aiAgentFlowRunID: number;
    executionSummary: string;
    isFailed: boolean;
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
    errorMessage?: string | null | undefined;
    logs?: {
        message?: string | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
        duration?: number | undefined;
    }[] | undefined;
    tokenUsages?: {
        model?: string | undefined;
        inputTokens?: number | undefined;
        outputTokens?: number | undefined;
        totalTokens?: number | undefined;
        cost?: number | undefined;
        currency?: string | undefined;
        providerRequestID?: string | undefined;
    }[] | undefined;
    tasks?: {
        priority: number;
        title: string;
        complexity: number;
        taskTypeID: number;
        estimatedEffort: number;
        description?: string | undefined;
    }[] | undefined;
    wikis?: {
        name: string;
        description?: string | undefined;
    }[] | undefined;
    technicalAnalysis?: {
        name: string;
        description?: string | undefined;
    } | undefined;
}, {
    taskID: number;
    aiAgentFlowRunID: number;
    executionSummary: string;
    isFailed: boolean;
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
    errorMessage?: string | null | undefined;
    logs?: {
        message?: string | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
        duration?: number | undefined;
    }[] | undefined;
    tokenUsages?: {
        model?: string | undefined;
        inputTokens?: number | undefined;
        outputTokens?: number | undefined;
        totalTokens?: number | undefined;
        cost?: number | undefined;
        currency?: string | undefined;
        providerRequestID?: string | undefined;
    }[] | undefined;
    tasks?: {
        priority: number;
        title: string;
        complexity: number;
        taskTypeID: number;
        estimatedEffort: number;
        description?: string | undefined;
    }[] | undefined;
    wikis?: {
        name: string;
        description?: string | undefined;
    }[] | undefined;
    technicalAnalysis?: {
        name: string;
        description?: string | undefined;
    } | undefined;
}>;
export type CompleteExecutionPayload = z.infer<typeof completeExecutionPayloadSchema>;
export declare function completeExecution(client: LaviyaApiClient, runtimeConfig: RuntimeConfig, logger: Logger, payload: CompleteExecutionPayload): Promise<unknown>;
//# sourceMappingURL=completeExecution.d.ts.map