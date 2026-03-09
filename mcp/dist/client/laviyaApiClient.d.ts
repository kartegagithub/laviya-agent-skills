import type { GlobalConfig } from "../config/loadGlobalConfig.js";
import type { Logger } from "../utils/logger.js";
export interface LaviyaApiClientOptions {
    baseUrl: string;
    apiKey: string;
    agentUid?: string;
    auth: GlobalConfig["auth"];
    retry: GlobalConfig["retry"];
    requestTimeoutSeconds: number;
    logger: Logger;
}
export declare class LaviyaApiError extends Error {
    readonly status?: number | undefined;
    readonly body?: unknown | undefined;
    constructor(message: string, status?: number | undefined, body?: unknown | undefined);
}
export declare class LaviyaApiClient {
    private readonly options;
    private capturedAgentUid;
    constructor(options: LaviyaApiClientOptions);
    getMyWork(params: {
        runId?: number;
        projectId?: number;
        agentProfile?: string;
        includeFileBytes?: boolean;
        previousLogsLimit?: number;
    }): Promise<unknown>;
    startExecution(params: {
        runId: number;
        taskId: number;
        executionId?: number;
    }): Promise<unknown>;
    completeExecution(payload: unknown, idempotencyKey: string): Promise<unknown>;
    reportTokenUsage(payload: unknown, idempotencyKey?: string): Promise<unknown>;
    private request;
    private requestOnce;
    private buildUrl;
    private parseResponseBody;
    private shouldRetry;
    private computeBackoff;
    private captureAgentUid;
    private resolveAgentUid;
}
//# sourceMappingURL=laviyaApiClient.d.ts.map