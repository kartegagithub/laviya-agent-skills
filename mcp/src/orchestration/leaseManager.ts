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
  private activeContext: LeaseContext | undefined;

  constructor(
    private readonly client: LaviyaApiClient,
    private readonly logger: Logger,
    private readonly refreshIntervalSeconds: number
  ) {}

  start(context: LeaseContext): void {
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

  stop(): void {
    if (!this.timer) {
      this.activeContext = undefined;
      return;
    }

    clearInterval(this.timer);
    this.timer = undefined;
    this.activeContext = undefined;
    this.logger.info("Stopped execution lease manager");
  }

  getActiveContext(): LeaseContext | undefined {
    if (!this.activeContext) {
      return undefined;
    }

    return { ...this.activeContext };
  }

  private async refresh(context: LeaseContext): Promise<void> {
    try {
      await this.client.startExecution(context);
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
