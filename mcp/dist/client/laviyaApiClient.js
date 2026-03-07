import { setTimeout as delay } from "node:timers/promises";
export class LaviyaApiError extends Error {
    status;
    body;
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
        this.name = "LaviyaApiError";
    }
}
export class LaviyaApiClient {
    options;
    constructor(options) {
        this.options = options;
    }
    async getMyWork(params) {
        return this.request({
            method: "GET",
            path: "/api/ai/GetMyWork",
            query: {
                RunID: params.runId,
                ProjectID: params.projectId,
                AgentProfile: params.agentProfile
            }
        });
    }
    async startExecution(params) {
        return this.request({
            method: "GET",
            path: "/api/ai/StartExecution",
            query: {
                AIAgentFlowRunID: params.runId,
                TaskID: params.taskId,
                AIAgentTaskExecutionID: params.executionId
            }
        });
    }
    async refreshExecutionLease(params) {
        try {
            return await this.request({
                method: "POST",
                path: "/api/ai/RefreshExecutionLease",
                body: {
                    aiAgentFlowRunID: params.runId,
                    taskID: params.taskId,
                    aiAgentTaskExecutionID: params.executionId
                }
            });
        }
        catch (error) {
            if (error instanceof LaviyaApiError && error.status === 404) {
                this.options.logger.warn("RefreshExecutionLease endpoint not found, falling back to StartExecution", {
                    runId: params.runId,
                    taskId: params.taskId
                });
                return this.startExecution(params);
            }
            throw error;
        }
    }
    async completeExecution(payload, idempotencyKey) {
        return this.request({
            method: "POST",
            path: "/api/ai/CompleteExecution",
            body: payload,
            idempotencyKey
        });
    }
    async reportTokenUsage(payload, idempotencyKey) {
        return this.request({
            method: "POST",
            path: "/api/ai/ReportTokenUsage",
            body: payload,
            idempotencyKey
        });
    }
    async request(options) {
        const maxAttempts = this.options.retry.maxAttempts;
        let attempt = 1;
        let lastError;
        while (attempt <= maxAttempts) {
            try {
                return await this.requestOnce(options, attempt);
            }
            catch (error) {
                lastError = error;
                const shouldRetry = this.shouldRetry(error, attempt);
                if (!shouldRetry) {
                    throw error;
                }
                const wait = this.computeBackoff(attempt);
                this.options.logger.warn("Laviya API request failed, retrying", {
                    path: options.path,
                    attempt,
                    waitMs: wait,
                    error: error instanceof Error ? error.message : String(error)
                });
                await delay(wait);
                attempt += 1;
            }
        }
        throw lastError instanceof Error ? lastError : new Error("Laviya API request failed");
    }
    async requestOnce(options, attempt) {
        const url = this.buildUrl(options.path, options.query);
        const headers = {
            "Content-Type": "application/json",
            [this.options.auth.headerName]: this.options.apiKey
        };
        if (this.options.auth.sendBearerToken) {
            headers.Authorization = `Bearer ${this.options.apiKey}`;
        }
        if (this.options.agentUid) {
            headers["X-Agent-UID"] = this.options.agentUid;
        }
        if (options.idempotencyKey) {
            headers["Idempotency-Key"] = options.idempotencyKey;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.options.requestTimeoutSeconds * 1_000);
        this.options.logger.debug("Sending Laviya API request", {
            method: options.method,
            path: options.path,
            attempt
        });
        try {
            const response = await fetch(url, {
                method: options.method,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: controller.signal
            });
            const parsedBody = await this.parseResponseBody(response);
            if (!response.ok) {
                throw new LaviyaApiError(`Laviya API error ${response.status} on ${options.path}`, response.status, parsedBody);
            }
            return parsedBody;
        }
        catch (error) {
            if (isAbortError(error)) {
                throw new LaviyaApiError(`Request timeout after ${this.options.requestTimeoutSeconds}s on ${options.path}`);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    buildUrl(path, query) {
        const url = new URL(path, this.options.baseUrl);
        if (!query) {
            return url;
        }
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
        return url;
    }
    async parseResponseBody(response) {
        const raw = await response.text();
        if (!raw) {
            return {};
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
            try {
                return JSON.parse(raw);
            }
            catch {
                return { raw };
            }
        }
        return { raw };
    }
    shouldRetry(error, attempt) {
        if (attempt >= this.options.retry.maxAttempts) {
            return false;
        }
        if (error instanceof LaviyaApiError) {
            if (!error.status) {
                return true;
            }
            return this.options.retry.retryOnHttpStatus.includes(error.status);
        }
        return true;
    }
    computeBackoff(attempt) {
        const exp = Math.min(this.options.retry.maxDelayMs, this.options.retry.baseDelayMs * 2 ** (attempt - 1));
        if (!this.options.retry.jitter) {
            return exp;
        }
        const jitter = Math.floor(Math.random() * 250);
        return Math.min(this.options.retry.maxDelayMs, exp + jitter);
    }
}
function isAbortError(error) {
    return error instanceof Error && error.name === "AbortError";
}
//# sourceMappingURL=laviyaApiClient.js.map