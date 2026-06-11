import type { RetryPolicyConfig } from "../config/loadGlobalConfig.js";
import type { Logger } from "../utils/logger.js";
export interface LaviyaApiClientOptions {
    baseUrl: string;
    apiKey: string;
    agentUid?: string;
    retry: RetryPolicyConfig;
    requestTimeoutSeconds: number;
    logger: Logger;
}
export declare class LaviyaApiClient {
    private readonly options;
    private readonly agentUidByRun;
    private readonly initialAgentUid;
    private readonly activeControllers;
    private readonly shutdownController;
    private shuttingDown;
    constructor(options: LaviyaApiClientOptions);
    getMyWork(params: {
        runId?: number;
        projectId?: number;
        agentProfile?: string;
        includeFileBytes?: boolean;
        previousLogsLimit?: number;
    }): Promise<unknown>;
    feedTask(params: {
        taskID: number;
    }): Promise<unknown>;
    getLocalWorkStatus(params: {
        runId: number;
    }): Promise<unknown>;
    cancelLocalWork(payload: unknown): Promise<unknown>;
    startExecution(params: {
        runId: number;
        taskId: number;
        executionId?: number;
    }): Promise<unknown>;
    addTaskComment(payload: unknown): Promise<unknown>;
    completeExecution(payload: unknown, idempotencyKey: string): Promise<unknown>;
    reportTokenUsage(payload: unknown, idempotencyKey?: string): Promise<unknown>;
    shutdown(): void;
    private request;
    private requestOnce;
    private buildUrl;
    private parseResponseBody;
    private readResponseBodyText;
    private shouldRetry;
    private computeBackoff;
    private captureAgentUid;
    private resolveAgentUid;
}
//# sourceMappingURL=laviyaApiClient.d.ts.map