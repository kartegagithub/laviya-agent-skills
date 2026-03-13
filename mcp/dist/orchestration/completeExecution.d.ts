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
    executionSummary: z.ZodString;
    errorMessage: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isFailed: z.ZodBoolean;
    logs: z.ZodOptional<z.ZodArray<z.ZodObject<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tasks: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedTaskInput, z.ZodTypeDef, GeneratedTaskInput>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
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
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tasks: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedTaskInput, z.ZodTypeDef, GeneratedTaskInput>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
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
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tasks: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedTaskInput, z.ZodTypeDef, GeneratedTaskInput>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>>;
}, z.ZodTypeAny, "passthrough">>, z.objectOutputType<{
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
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tasks: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedTaskInput, z.ZodTypeDef, GeneratedTaskInput>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
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
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        actionType: z.ZodOptional<z.ZodString>;
        actionDetails: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
        level: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tokenUsages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        model: z.ZodOptional<z.ZodString>;
        inputTokens: z.ZodOptional<z.ZodNumber>;
        outputTokens: z.ZodOptional<z.ZodNumber>;
        totalTokens: z.ZodOptional<z.ZodNumber>;
        cost: z.ZodOptional<z.ZodNumber>;
        currency: z.ZodOptional<z.ZodString>;
        providerRequestID: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    tasks: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedTaskInput, z.ZodTypeDef, GeneratedTaskInput>, "many">>;
    wikis: z.ZodOptional<z.ZodArray<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>, "many">>;
    technicalAnalysis: z.ZodOptional<z.ZodType<GeneratedWikiInput, z.ZodTypeDef, GeneratedWikiInput>>;
}, z.ZodTypeAny, "passthrough">>;
export type CompleteExecutionPayload = z.infer<typeof completeExecutionPayloadSchema>;
export declare function completeExecution(client: LaviyaApiClient, runtimeConfig: RuntimeConfig, logger: Logger, payload: CompleteExecutionPayload): Promise<unknown>;
export {};
//# sourceMappingURL=completeExecution.d.ts.map