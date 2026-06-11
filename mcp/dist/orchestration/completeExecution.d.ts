import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
type GeneratedTaskInput = {
    title: string;
    description?: string;
    complexity: number;
    priority: number;
    taskTypeID: number;
    estimatedEffort: number;
    referenceID?: string;
    subTasks?: GeneratedTaskInput[];
};
type GeneratedWikiInput = {
    name: string;
    description?: string;
    subWikis?: GeneratedWikiInput[];
    relatedTaskReferenceIDs?: string[];
};
export declare const completeExecutionPayloadSchema: z.ZodEffects<z.ZodObject<{
    taskID: z.ZodNumber;
    aiAgentFlowRunID: z.ZodNumber;
    aiAgentTaskExecutionID: z.ZodOptional<z.ZodNumber>;
    requestKey: z.ZodOptional<z.ZodString>;
    executionSummary: z.ZodOptional<z.ZodString>;
    executionSummaryObject: z.ZodOptional<z.ZodUnknown>;
    errorMessage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isFailed: z.ZodBoolean;
    logs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        message?: string | undefined;
        duration?: number | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
    }, {
        message?: string | undefined;
        duration?: number | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
    }>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
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
    }>, {
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
    tasks: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedTaskInput, z.ZodTypeDef, GeneratedTaskInput>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    lessons: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>>;
    executionEvidence: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        workspaceChanged: z.ZodBoolean;
        changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        enforcementLevel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>, {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    }, {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    aiAgentFlowRunID: number;
    taskID: number;
    isFailed: boolean;
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
    executionSummary?: string | undefined;
    executionSummaryObject?: unknown;
    errorMessage?: string | null | undefined;
    logs?: {
        message?: string | undefined;
        duration?: number | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
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
    tasks?: GeneratedTaskInput[] | undefined;
    wikis?: GeneratedWikiInput[] | undefined;
    lessons?: GeneratedWikiInput[] | undefined;
    technicalAnalysis?: GeneratedWikiInput | undefined;
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    aiAgentFlowRunID: number;
    taskID: number;
    isFailed: boolean;
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
    executionSummary?: string | undefined;
    executionSummaryObject?: unknown;
    errorMessage?: string | null | undefined;
    logs?: {
        message?: string | undefined;
        duration?: number | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
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
    tasks?: GeneratedTaskInput[] | undefined;
    wikis?: GeneratedWikiInput[] | undefined;
    lessons?: GeneratedWikiInput[] | undefined;
    technicalAnalysis?: GeneratedWikiInput | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>, {
    aiAgentFlowRunID: number;
    taskID: number;
    isFailed: boolean;
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
    executionSummary?: string | undefined;
    executionSummaryObject?: unknown;
    errorMessage?: string | null | undefined;
    logs?: {
        message?: string | undefined;
        duration?: number | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
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
    tasks?: GeneratedTaskInput[] | undefined;
    wikis?: GeneratedWikiInput[] | undefined;
    lessons?: GeneratedWikiInput[] | undefined;
    technicalAnalysis?: GeneratedWikiInput | undefined;
    executionEvidence?: {
        performedCapabilities: string[];
        workspaceChanged: boolean;
        changedFiles: string[];
        enforcementLevel?: string | undefined;
    } | undefined;
}, {
    aiAgentFlowRunID: number;
    taskID: number;
    isFailed: boolean;
    aiAgentTaskExecutionID?: number | undefined;
    requestKey?: string | undefined;
    executionSummary?: string | undefined;
    executionSummaryObject?: unknown;
    errorMessage?: string | null | undefined;
    logs?: {
        message?: string | undefined;
        duration?: number | undefined;
        actionType?: string | undefined;
        actionDetails?: string | undefined;
        level?: string | undefined;
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
    tasks?: GeneratedTaskInput[] | undefined;
    wikis?: GeneratedWikiInput[] | undefined;
    lessons?: GeneratedWikiInput[] | undefined;
    technicalAnalysis?: GeneratedWikiInput | undefined;
    executionEvidence?: {
        workspaceChanged: boolean;
        performedCapabilities?: string[] | undefined;
        changedFiles?: string[] | undefined;
        enforcementLevel?: string | undefined;
    } | undefined;
}>;
export type CompleteExecutionPayload = z.infer<typeof completeExecutionPayloadSchema>;
export declare function completeExecution(client: LaviyaApiClient, runtimeConfig: RuntimeConfig, logger: Logger, payload: CompleteExecutionPayload): Promise<unknown>;
export {};
//# sourceMappingURL=completeExecution.d.ts.map