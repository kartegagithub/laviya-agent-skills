import { setInterval, clearInterval } from "node:timers";
export class LeaseManager {
    client;
    logger;
    refreshIntervalSeconds;
    timer;
    constructor(client, logger, refreshIntervalSeconds) {
        this.client = client;
        this.logger = logger;
        this.refreshIntervalSeconds = refreshIntervalSeconds;
    }
    start(context) {
        if (this.timer) {
            return;
        }
        this.logger.info("Starting execution lease manager", {
            runId: context.runId,
            taskId: context.taskId,
            executionId: context.executionId,
            refreshIntervalSeconds: this.refreshIntervalSeconds
        });
        this.timer = setInterval(() => {
            void this.refresh(context);
        }, this.refreshIntervalSeconds * 1_000);
    }
    stop() {
        if (!this.timer) {
            return;
        }
        clearInterval(this.timer);
        this.timer = undefined;
        this.logger.info("Stopped execution lease manager");
    }
    async refresh(context) {
        try {
            await this.client.refreshExecutionLease(context);
            this.logger.debug("Execution lease refreshed", {
                runId: context.runId,
                taskId: context.taskId,
                executionId: context.executionId
            });
        }
        catch (error) {
            this.logger.error("Execution lease refresh failed", {
                runId: context.runId,
                taskId: context.taskId,
                executionId: context.executionId,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
}
//# sourceMappingURL=leaseManager.js.map