import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";

export interface LeaseContext {
  runId: number;
  taskId: number;
  executionId?: number;
}

type LeaseState = "active" | "paused";

interface LeaseEntry {
  key: string;
  context: LeaseContext;
  state: LeaseState;
  timer?: unknown;
  generation: number;
}

export interface LeaseScheduler {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

const defaultScheduler: LeaseScheduler = {
  setTimeout(callback, delayMs) {
    const timer = setTimeout(callback, delayMs);
    timer.unref?.();
    return timer;
  },
  clearTimeout(handle) {
    clearTimeout(handle as NodeJS.Timeout);
  }
};

export class LeaseManager {
  private readonly entries = new Map<string, LeaseEntry>();

  constructor(
    private readonly client: LaviyaApiClient,
    private readonly logger: Logger,
    private readonly refreshIntervalSeconds: number,
    private readonly scheduler: LeaseScheduler = defaultScheduler
  ) {}

  start(context: LeaseContext): string {
    const key = leaseKey(context);
    const existing = this.entries.get(key);
    if (existing) {
      existing.context = { ...context };
      existing.state = "active";
      existing.generation += 1;
      this.clearEntryTimer(existing);
      this.schedule(existing);
      this.logger.info("Restarted execution lease", logContext(existing.context));
      return key;
    }

    const entry: LeaseEntry = {
      key,
      context: { ...context },
      state: "active",
      generation: 1
    };
    this.entries.set(key, entry);
    this.schedule(entry);
    this.logger.info("Started execution lease", {
      ...logContext(context),
      refreshIntervalSeconds: this.refreshIntervalSeconds
    });
    return key;
  }

  find(context: LeaseContext): LeaseContext | undefined {
    const exact = this.entries.get(leaseKey(context));
    if (exact) {
      return { ...exact.context };
    }

    const matches = Array.from(this.entries.values()).filter(
      (entry) =>
        entry.context.runId === context.runId &&
        entry.context.taskId === context.taskId &&
        (context.executionId === undefined || entry.context.executionId === undefined)
    );
    return matches.length === 1 ? { ...matches[0]!.context } : undefined;
  }

  pauseForCompletion(context: LeaseContext): boolean {
    const entry = this.resolveEntry(context);
    if (!entry) {
      return false;
    }

    entry.state = "paused";
    entry.generation += 1;
    this.clearEntryTimer(entry);
    this.logger.info("Paused execution lease for completion", logContext(entry.context));
    return true;
  }

  resumeAfterCompletionFailure(context: LeaseContext): boolean {
    const entry = this.resolveEntry(context);
    if (!entry || entry.state !== "paused") {
      return false;
    }

    entry.state = "active";
    entry.generation += 1;
    this.schedule(entry);
    this.logger.warn("Resumed execution lease after completion failure", logContext(entry.context));
    return true;
  }

  complete(context: LeaseContext): boolean {
    const entry = this.resolveEntry(context);
    if (!entry) {
      return false;
    }

    this.deleteEntry(entry);
    this.logger.info("Completed and removed execution lease", logContext(entry.context));
    return true;
  }

  stop(context: LeaseContext): boolean {
    const entry = this.resolveEntry(context);
    if (!entry) {
      return false;
    }

    this.deleteEntry(entry);
    this.logger.info("Stopped execution lease", logContext(entry.context));
    return true;
  }

  stopByRun(runId: number): number {
    const entries = Array.from(this.entries.values()).filter((entry) => entry.context.runId === runId);
    for (const entry of entries) {
      this.deleteEntry(entry);
    }

    if (entries.length > 0) {
      this.logger.info("Stopped execution leases for run", {
        runId,
        count: entries.length
      });
    }
    return entries.length;
  }

  stopAll(): number {
    const count = this.entries.size;
    for (const entry of this.entries.values()) {
      this.clearEntryTimer(entry);
    }
    this.entries.clear();
    if (count > 0) {
      this.logger.info("Stopped all execution leases", { count });
    }
    return count;
  }

  getActiveContexts(): LeaseContext[] {
    return Array.from(this.entries.values(), (entry) => ({ ...entry.context }));
  }

  private schedule(entry: LeaseEntry): void {
    if (entry.state !== "active" || !this.entries.has(entry.key)) {
      return;
    }

    const generation = entry.generation;
    entry.timer = this.scheduler.setTimeout(() => {
      entry.timer = undefined;
      void this.refresh(entry.key, generation);
    }, this.refreshIntervalSeconds * 1_000);
  }

  private async refresh(key: string, generation: number): Promise<void> {
    const entry = this.entries.get(key);
    if (!entry || entry.state !== "active" || entry.generation !== generation) {
      return;
    }

    try {
      await this.client.startExecution(entry.context);
      this.logger.debug("Execution lease refreshed", logContext(entry.context));
    } catch (error: unknown) {
      this.logger.error("Execution lease refresh failed", {
        ...logContext(entry.context),
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      const current = this.entries.get(key);
      if (current && current.state === "active" && current.generation === generation) {
        this.schedule(current);
      }
    }
  }

  private resolveEntry(context: LeaseContext): LeaseEntry | undefined {
    const exact = this.entries.get(leaseKey(context));
    if (exact) {
      return exact;
    }

    const matches = Array.from(this.entries.values()).filter(
      (entry) =>
        entry.context.runId === context.runId &&
        entry.context.taskId === context.taskId &&
        (context.executionId === undefined || entry.context.executionId === undefined)
    );
    return matches.length === 1 ? matches[0] : undefined;
  }

  private deleteEntry(entry: LeaseEntry): void {
    entry.generation += 1;
    this.clearEntryTimer(entry);
    this.entries.delete(entry.key);
  }

  private clearEntryTimer(entry: LeaseEntry): void {
    if (entry.timer === undefined) {
      return;
    }
    this.scheduler.clearTimeout(entry.timer);
    entry.timer = undefined;
  }
}

export function leaseKey(context: LeaseContext): string {
  return `${context.runId}:${context.taskId}:${context.executionId ?? "pending"}`;
}

function logContext(context: LeaseContext): Record<string, unknown> {
  return {
    runId: context.runId,
    taskId: context.taskId,
    executionId: context.executionId
  };
}
