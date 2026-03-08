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
    capturedAgentUid;
    refreshExecutionLeaseEndpointMissing = false;
    constructor(options) {
        this.options = options;
    }
    async getMyWork(params) {
        const response = await this.request({
            method: "GET",
            path: "/api/ai/GetMyWork",
            query: {
                RunID: params.runId,
                ProjectID: params.projectId,
                AgentProfile: params.agentProfile
            }
        });
        this.captureAgentUid(response);
        return response;
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
        if (this.refreshExecutionLeaseEndpointMissing) {
            return this.startExecution(params);
        }
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
                this.refreshExecutionLeaseEndpointMissing = true;
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
            idempotencyKey,
            timeoutSeconds: Math.max(120, this.options.requestTimeoutSeconds)
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
                const shouldRetry = this.shouldRetry(options, error, attempt);
                if (!shouldRetry) {
                    throw error;
                }
                const wait = this.computeBackoff(attempt);
                const errorContext = buildErrorContext(error);
                this.options.logger.warn("Laviya API request failed, retrying", {
                    path: options.path,
                    attempt,
                    waitMs: wait,
                    ...errorContext
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
        const activeAgentUid = this.resolveAgentUid();
        if (activeAgentUid) {
            headers["X-Agent-UID"] = activeAgentUid;
        }
        if (options.idempotencyKey) {
            headers["Idempotency-Key"] = options.idempotencyKey;
        }
        const controller = new AbortController();
        const timeoutSeconds = resolveTimeoutSeconds(options, this.options.requestTimeoutSeconds);
        const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1_000);
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
            let parsedBody;
            try {
                parsedBody = await this.parseResponseBody(response);
            }
            catch (error) {
                const normalizedStatus = response.status >= 400 ? response.status : undefined;
                throw new LaviyaApiError(`Failed to read response body on ${options.path} (HTTP ${response.status})`, normalizedStatus, {
                    responseStatus: response.status,
                    ...buildErrorContext(error)
                });
            }
            if (!response.ok) {
                throw new LaviyaApiError(`Laviya API error ${response.status} on ${options.path}`, response.status, parsedBody);
            }
            return parsedBody;
        }
        catch (error) {
            if (isAbortError(error)) {
                throw new LaviyaApiError(`Request timeout after ${timeoutSeconds}s on ${options.path}`);
            }
            if (isTerminatedError(error)) {
                throw new LaviyaApiError(`Connection terminated on ${options.path}`);
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
    shouldRetry(options, error, attempt) {
        if (attempt >= this.options.retry.maxAttempts) {
            return false;
        }
        if (error instanceof LaviyaApiError) {
            if (options.path === "/api/ai/CompleteExecution") {
                return false;
            }
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
    captureAgentUid(payload) {
        const discoveredAgentUid = extractAgentUid(payload);
        if (!discoveredAgentUid) {
            return;
        }
        if (this.options.agentUid && this.options.agentUid !== discoveredAgentUid) {
            this.options.logger.warn("GetMyWork response contains a different AIAgentUID than configured LAVIYA_AGENT_UID. Keeping configured value.");
            return;
        }
        if (this.capturedAgentUid === discoveredAgentUid) {
            return;
        }
        this.capturedAgentUid = discoveredAgentUid;
        this.options.logger.info("Captured AIAgentUID from GetMyWork response for follow-up requests.");
    }
    resolveAgentUid() {
        return this.options.agentUid ?? this.capturedAgentUid;
    }
}
function isAbortError(error) {
    return error instanceof Error && error.name === "AbortError";
}
function isTerminatedError(error) {
    return error instanceof Error && /terminated/i.test(error.message);
}
function resolveTimeoutSeconds(options, defaultTimeoutSeconds) {
    if (options.timeoutSeconds && Number.isFinite(options.timeoutSeconds) && options.timeoutSeconds > 0) {
        return options.timeoutSeconds;
    }
    return defaultTimeoutSeconds;
}
function extractAgentUid(payload) {
    const root = asRecord(payload);
    const candidates = [payload];
    if (root) {
        candidates.push(root.Data, root.data);
    }
    for (const candidate of candidates) {
        const record = asRecord(candidate);
        if (!record) {
            continue;
        }
        const uid = toNonEmptyString(record.AIAgentUID) ??
            toNonEmptyString(record.aiAgentUID) ??
            toNonEmptyString(record.AgentUID) ??
            toNonEmptyString(record.agentUID);
        if (uid) {
            return uid;
        }
    }
    return undefined;
}
function buildErrorContext(error) {
    if (!(error instanceof Error)) {
        return {
            error: String(error)
        };
    }
    const context = {
        error: error.message,
        errorName: error.name
    };
    const errorCode = extractCode(error);
    if (errorCode) {
        context.errorCode = errorCode;
    }
    const cause = asRecord(error.cause);
    if (cause) {
        const causeMessage = toNonEmptyString(cause.message);
        if (causeMessage) {
            context.cause = causeMessage;
        }
        const causeCode = extractCode(cause);
        if (causeCode) {
            context.causeCode = causeCode;
        }
    }
    return context;
}
function extractCode(value) {
    const record = asRecord(value);
    if (!record) {
        return undefined;
    }
    const code = record.code;
    if (typeof code === "string" || typeof code === "number") {
        return String(code);
    }
    return undefined;
}
function toNonEmptyString(value) {
    if (typeof value !== "string") {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
//# sourceMappingURL=laviyaApiClient.js.map