const defaultScheduler = {
    setTimeout(callback, delayMs) {
        const timer = setTimeout(callback, delayMs);
        timer.unref?.();
        return timer;
    },
    clearTimeout(handle) {
        clearTimeout(handle);
    }
};
export class LeaseManager {
    client;
    logger;
    refreshIntervalSeconds;
    scheduler;
    entries = new Map();
    constructor(client, logger, refreshIntervalSeconds, scheduler = defaultScheduler) {
        this.client = client;
        this.logger = logger;
        this.refreshIntervalSeconds = refreshIntervalSeconds;
        this.scheduler = scheduler;
    }
    start(context) {
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
        const entry = {
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
    find(context) {
        const exact = this.entries.get(leaseKey(context));
        if (exact) {
            return { ...exact.context };
        }
        const matches = Array.from(this.entries.values()).filter((entry) => entry.context.runId === context.runId &&
            entry.context.taskId === context.taskId &&
            (context.executionId === undefined || entry.context.executionId === undefined));
        return matches.length === 1 ? { ...matches[0].context } : undefined;
    }
    pauseForCompletion(context) {
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
    resumeAfterCompletionFailure(context) {
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
    complete(context) {
        const entry = this.resolveEntry(context);
        if (!entry) {
            return false;
        }
        this.deleteEntry(entry);
        this.logger.info("Completed and removed execution lease", logContext(entry.context));
        return true;
    }
    stop(context) {
        const entry = this.resolveEntry(context);
        if (!entry) {
            return false;
        }
        this.deleteEntry(entry);
        this.logger.info("Stopped execution lease", logContext(entry.context));
        return true;
    }
    stopByRun(runId) {
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
    stopAll() {
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
    getActiveContexts() {
        return Array.from(this.entries.values(), (entry) => ({ ...entry.context }));
    }
    schedule(entry) {
        if (entry.state !== "active" || !this.entries.has(entry.key)) {
            return;
        }
        const generation = entry.generation;
        entry.timer = this.scheduler.setTimeout(() => {
            entry.timer = undefined;
            void this.refresh(entry.key, generation);
        }, this.refreshIntervalSeconds * 1_000);
    }
    async refresh(key, generation) {
        const entry = this.entries.get(key);
        if (!entry || entry.state !== "active" || entry.generation !== generation) {
            return;
        }
        try {
            await this.client.startExecution(entry.context);
            this.logger.debug("Execution lease refreshed", logContext(entry.context));
        }
        catch (error) {
            this.logger.error("Execution lease refresh failed", {
                ...logContext(entry.context),
                error: error instanceof Error ? error.message : String(error)
            });
        }
        finally {
            const current = this.entries.get(key);
            if (current && current.state === "active" && current.generation === generation) {
                this.schedule(current);
            }
        }
    }
    resolveEntry(context) {
        const exact = this.entries.get(leaseKey(context));
        if (exact) {
            return exact;
        }
        const matches = Array.from(this.entries.values()).filter((entry) => entry.context.runId === context.runId &&
            entry.context.taskId === context.taskId &&
            (context.executionId === undefined || entry.context.executionId === undefined));
        return matches.length === 1 ? matches[0] : undefined;
    }
    deleteEntry(entry) {
        entry.generation += 1;
        this.clearEntryTimer(entry);
        this.entries.delete(entry.key);
    }
    clearEntryTimer(entry) {
        if (entry.timer === undefined) {
            return;
        }
        this.scheduler.clearTimeout(entry.timer);
        entry.timer = undefined;
    }
}
export function leaseKey(context) {
    return `${context.runId}:${context.taskId}:${context.executionId ?? "pending"}`;
}
function logContext(context) {
    return {
        runId: context.runId,
        taskId: context.taskId,
        executionId: context.executionId
    };
}
//# sourceMappingURL=leaseManager.js.map