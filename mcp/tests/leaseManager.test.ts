import assert from "node:assert/strict";
import test from "node:test";
import type { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import {
  LeaseManager,
  type LeaseScheduler
} from "../src/orchestration/leaseManager.js";
import { createLogger } from "../src/utils/logger.js";

test("tracks parallel leases independently", () => {
  const scheduler = new ManualScheduler();
  const manager = createManager(scheduler);

  manager.start({ runId: 1, taskId: 10, executionId: 100 });
  manager.start({ runId: 2, taskId: 20, executionId: 200 });

  assert.deepEqual(manager.getActiveContexts(), [
    { runId: 1, taskId: 10, executionId: 100 },
    { runId: 2, taskId: 20, executionId: 200 }
  ]);
  assert.equal(manager.stopByRun(1), 1);
  assert.deepEqual(manager.getActiveContexts(), [
    { runId: 2, taskId: 20, executionId: 200 }
  ]);
});

test("pauses, resumes, and completes only the selected lease", () => {
  const scheduler = new ManualScheduler();
  const manager = createManager(scheduler);
  const first = { runId: 1, taskId: 10, executionId: 100 };
  const second = { runId: 2, taskId: 20, executionId: 200 };

  manager.start(first);
  manager.start(second);
  assert.equal(scheduler.pendingCount, 2);

  assert.equal(manager.pauseForCompletion(first), true);
  assert.equal(scheduler.pendingCount, 1);
  assert.equal(manager.resumeAfterCompletionFailure(first), true);
  assert.equal(scheduler.pendingCount, 2);
  assert.equal(manager.complete(first), true);
  assert.equal(scheduler.pendingCount, 1);
  assert.deepEqual(manager.getActiveContexts(), [second]);
});

test("does not overlap refresh calls for the same lease", async () => {
  const scheduler = new ManualScheduler();
  let resolveRefresh: (() => void) | undefined;
  let callCount = 0;
  const client = {
    startExecution: async () => {
      callCount += 1;
      await new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });
      return { HasFailed: false };
    }
  } as unknown as LaviyaApiClient;
  const manager = new LeaseManager(client, createLogger("error"), 30, scheduler);

  manager.start({ runId: 1, taskId: 10, executionId: 100 });
  scheduler.runNext();
  await Promise.resolve();

  assert.equal(callCount, 1);
  assert.equal(scheduler.pendingCount, 0);

  resolveRefresh?.();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(scheduler.pendingCount, 1);
});

function createManager(scheduler: ManualScheduler): LeaseManager {
  const client = {
    startExecution: async () => ({ HasFailed: false })
  } as unknown as LaviyaApiClient;
  return new LeaseManager(client, createLogger("error"), 30, scheduler);
}

class ManualScheduler implements LeaseScheduler {
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();

  get pendingCount(): number {
    return this.callbacks.size;
  }

  setTimeout(callback: () => void): unknown {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  clearTimeout(handle: unknown): void {
    this.callbacks.delete(handle as number);
  }

  runNext(): void {
    const entry = this.callbacks.entries().next().value as [number, () => void] | undefined;
    assert.ok(entry, "Expected a scheduled callback.");
    this.callbacks.delete(entry[0]);
    entry[1]();
  }
}
