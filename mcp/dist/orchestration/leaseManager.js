import { setInterval, clearInterval } from "node:timers";
export class LeaseManager {
    client;
    logger;
    refreshIntervalSeconds;
    timer;
    activeContext;
    constructor(client, logger, refreshIntervalSeconds) {
        this.client = client;
        this.logger = logger;
        this.refreshIntervalSeconds = refreshIntervalSeconds;
    }
    start(context) {
        this.activeContext = { ...context };
        if (this.timer) {
            this.logger.info("Updated execution lease manager context", {
                runId: context.runId,
                taskId: context.taskId,
                executionId: context.executionId
            });
            return;
        }
        this.logger.info("Starting execution lease manager", {
            runId: context.runId,
            taskId: context.taskId,
            executionId: context.executionId,
            refreshIntervalSeconds: this.refreshIntervalSeconds
        });
        this.timer = setInterval(() => {
            if (!this.activeContext) {
                return;
            }
            void this.refresh(this.activeContext);
        }, this.refreshIntervalSeconds * 1_000);
    }
    stop() {
        if (!this.timer) {
            this.activeContext = undefined;
            return;
        }
        clearInterval(this.timer);
        this.timer = undefined;
        this.activeContext = undefined;
        this.logger.info("Stopped execution lease manager");
    }
    getActiveContext() {
        if (!this.activeContext) {
            return undefined;
        }
        return { ...this.activeContext };
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