import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface LeaseContext {
    runId: number;
    taskId: number;
    executionId?: number;
}
export interface LeaseScheduler {
    setTimeout(callback: () => void, delayMs: number): unknown;
    clearTimeout(handle: unknown): void;
}
export declare class LeaseManager {
    private readonly client;
    private readonly logger;
    private readonly refreshIntervalSeconds;
    private readonly scheduler;
    private readonly entries;
    constructor(client: LaviyaApiClient, logger: Logger, refreshIntervalSeconds: number, scheduler?: LeaseScheduler);
    start(context: LeaseContext): string;
    find(context: LeaseContext): LeaseContext | undefined;
    pauseForCompletion(context: LeaseContext): boolean;
    resumeAfterCompletionFailure(context: LeaseContext): boolean;
    complete(context: LeaseContext): boolean;
    stop(context: LeaseContext): boolean;
    stopByRun(runId: number): number;
    stopAll(): number;
    getActiveContexts(): LeaseContext[];
    private schedule;
    private refresh;
    private resolveEntry;
    private deleteEntry;
    private clearEntryTimer;
}
export declare function leaseKey(context: LeaseContext): string;
//# sourceMappingURL=leaseManager.d.ts.map