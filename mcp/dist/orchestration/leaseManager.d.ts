import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface LeaseContext {
    runId: number;
    taskId: number;
    executionId?: number;
}
export declare class LeaseManager {
    private readonly client;
    private readonly logger;
    private readonly refreshIntervalSeconds;
    private timer;
    private activeContext;
    constructor(client: LaviyaApiClient, logger: Logger, refreshIntervalSeconds: number);
    start(context: LeaseContext): void;
    stop(): void;
    getActiveContext(): LeaseContext | undefined;
    private refresh;
}
//# sourceMappingURL=leaseManager.d.ts.map