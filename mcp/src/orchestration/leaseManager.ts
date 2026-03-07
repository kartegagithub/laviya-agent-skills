import { setInterval, clearInterval } from "node:timers";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export interface LeaseContext {
  runId: number;
  taskId: number;
  executionId?: number;
}

export class LeaseManager {
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly client: LaviyaApiClient,
    private readonly logger: Logger,
    private readonly refreshIntervalSeconds: number
  ) {}

  start(context: LeaseContext): void {
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

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
    this.logger.info("Stopped execution lease manager");
  }

  private async refresh(context: LeaseContext): Promise<void> {
    try {
      await this.client.refreshExecutionLease(context);
      this.logger.debug("Execution lease refreshed", {
        runId: context.runId,
        taskId: context.taskId,
        executionId: context.executionId
      });
    } catch (error: unknown) {
      this.logger.error("Execution lease refresh failed", {
        runId: context.runId,
        taskId: context.taskId,
        executionId: context.executionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
