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
    getProjects(params: {
        search?: string;
    }): Promise<unknown>;
    createTasks(payload: unknown, idempotencyKey: string): Promise<unknown>;
    getTask(taskID: string): Promise<unknown>;
    /** Bytes of a task file (GET /api/ai/GetFile); credentials go in headers like every other call. */
    downloadFile(fileID: number): Promise<Buffer>;
    uploadTaskFile(payload: {
        taskID: number;
        fileName: string;
        contentBase64: string;
    }): Promise<unknown>;
    updateTaskDescription(payload: {
        taskID: number;
        text?: string;
        mode?: string;
        fileIDs?: number[];
    }): Promise<unknown>;
    addTaskAssignees(payload: {
        taskID: number;
        assigneeEmails?: string[];
    }): Promise<unknown>;
    getTasks(params: {
        projectID?: number;
        assignedTo?: string;
        status?: string;
        search?: string;
        taskTypeIDs?: number[];
        page?: number;
        pageSize?: number;
        lite?: boolean;
    }): Promise<unknown>;
    getFolders(params: {
        projectID: number;
        search?: string;
    }): Promise<unknown>;
    createFolder(payload: {
        projectID: number;
        name: string;
        startDate?: string;
        endDate?: string;
        sortOrder?: number;
    }): Promise<unknown>;
    setTaskFolders(payload: {
        folderID: number;
        taskIDs: number[];
        remove: boolean;
    }): Promise<unknown>;
    getWikis(params: {
        projectID: number;
        search?: string;
        parentWikiID?: number;
    }): Promise<unknown>;
    getWiki(wikiID: number): Promise<unknown>;
    createWiki(payload: {
        projectID: number;
        parentWikiID?: number;
        name: string;
        content?: string;
        relatedTaskIDs?: number[];
        requestKey: string;
    }): Promise<unknown>;
    updateWiki(payload: {
        wikiID: number;
        name?: string;
        content?: string;
        mode: "replace" | "append";
    }): Promise<unknown>;
    getTaskTestCases(taskID: string): Promise<unknown>;
    saveTaskTestCases(payload: {
        taskID: number;
        cases: Array<{
            referenceID: string;
            title: string;
            preconditions?: string;
            steps?: string;
            expectedResult?: string;
            sortOrder?: number;
        }>;
    }): Promise<unknown>;
    addTaskTestRun(payload: {
        taskID: number;
        taskTestCaseID?: number;
        referenceID?: string;
        result: string;
        evidence?: string;
        evidenceFileIDs?: number[];
    }): Promise<unknown>;
    getTaskLinks(taskID: string): Promise<unknown>;
    addTaskLink(payload: {
        taskID: number;
        url: string;
    }): Promise<unknown>;
    removeTaskLink(payload: {
        taskID: number;
        linkID: number;
    }): Promise<unknown>;
    startDeliveryRun(payload: {
        taskIDs: number[];
        title?: string;
    }): Promise<unknown>;
    startTaskWork(payload: {
        taskID: number;
        deliveryRunID?: number;
    }): Promise<unknown>;
    completeTaskWork(payload: unknown, idempotencyKey: string): Promise<unknown>;
    reportRuntimeHeartbeat(payload: unknown): Promise<unknown>;
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