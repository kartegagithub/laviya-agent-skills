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
    activeAgentUid;
    constructor(options) {
        this.options = options;
        this.activeAgentUid = options.agentUid;
    }
    async getMyWork(params) {
        return this.request({
            method: "GET",
            path: "/api/ai/GetMyWork",
            query: {
                RunID: params.runId,
                ProjectID: params.projectId,
                AgentProfile: params.agentProfile,
                IncludeFileBytes: params.includeFileBytes === undefined ? undefined : params.includeFileBytes ? "true" : "false",
                PreviousLogsLimit: params.previousLogsLimit
            }
        });
    }
    async feedTask(params) {
        return this.request({
            method: "GET",
            path: "/api/ai/FeedTask",
            query: {
                TaskID: params.taskID
            }
        });
    }
    async getLocalWorkStatus(params) {
        return this.request({
            method: "GET",
            path: "/api/ai/GetLocalWorkStatus",
            query: {
                RunID: params.runId
            }
        });
    }
    async cancelLocalWork(payload) {
        return this.request({
            method: "POST",
            path: "/api/ai/CancelLocalWork",
            body: payload
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
    async addTaskComment(payload) {
        return this.request({
            method: "POST",
            path: "/api/ai/AddTaskComment",
            body: payload
        });
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
        const activeAgentUid = this.resolveAgentUid();
        const url = this.buildUrl(options.path, options.query, activeAgentUid);
        const serializedBody = options.body === undefined ? undefined : JSON.stringify(options.body);
        const headers = {
            [this.options.auth.headerName]: this.options.apiKey
        };
        if (serializedBody !== undefined) {
            headers["Content-Type"] = "application/json; charset=utf-8";
        }
        if (this.options.auth.sendBearerToken) {
            headers.Authorization = `Bearer ${this.options.apiKey}`;
        }
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
                body: serializedBody,
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
            this.captureAgentUid(parsedBody, options.path);
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
    buildUrl(path, query, activeAgentUid) {
        const url = new URL(path, this.options.baseUrl);
        if (!query) {
            url.searchParams.set("apiKey", this.options.apiKey);
            if (activeAgentUid) {
                url.searchParams.set("agentUID", activeAgentUid);
            }
            return url;
        }
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) {
                url.searchParams.set(key, String(value));
            }
        }
        url.searchParams.set("apiKey", this.options.apiKey);
        if (activeAgentUid) {
            url.searchParams.set("agentUID", activeAgentUid);
        }
        return url;
    }
    async parseResponseBody(response) {
        const raw = await this.readResponseBodyText(response);
        if (!raw) {
            return {};
        }
        const contentType = response.headers.get("content-type") ?? "";
        if (isJsonContentType(contentType)) {
            try {
                return JSON.parse(raw);
            }
            catch {
                return { raw };
            }
        }
        return { raw };
    }
    async readResponseBodyText(response) {
        const bodyBuffer = await response.arrayBuffer();
        if (bodyBuffer.byteLength === 0) {
            return "";
        }
        const charset = extractCharset(response.headers.get("content-type"));
        if (charset) {
            try {
                return new TextDecoder(charset).decode(bodyBuffer);
            }
            catch {
                this.options.logger.warn("Unsupported response charset. Falling back to UTF-8 decode.", { charset });
            }
        }
        return new TextDecoder("utf-8").decode(bodyBuffer);
    }
    shouldRetry(options, error, attempt) {
        if (attempt >= this.options.retry.maxAttempts) {
            return false;
        }
        if (error instanceof LaviyaApiError) {
            if (options.path === "/api/ai/CompleteExecution" || options.path === "/api/ai/AddTaskComment") {
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
    captureAgentUid(payload, sourcePath) {
        const discoveredAgentUid = extractAgentUid(payload);
        if (!discoveredAgentUid) {
            return;
        }
        if (this.activeAgentUid === discoveredAgentUid) {
            return;
        }
        const previousAgentUid = this.activeAgentUid;
        this.activeAgentUid = discoveredAgentUid;
        if (!previousAgentUid) {
            this.options.logger.info("Captured AIAgentUID from API response for follow-up requests.", {
                sourcePath,
                agentUid: summarizeAgentUid(discoveredAgentUid)
            });
            return;
        }
        this.options.logger.info("Detected AIAgentUID change from API response and switched active agent context.", {
            sourcePath,
            previousAgentUid: summarizeAgentUid(previousAgentUid),
            activeAgentUid: summarizeAgentUid(discoveredAgentUid)
        });
    }
    resolveAgentUid() {
        return this.activeAgentUid;
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
function summarizeAgentUid(value) {
    const trimmed = value.trim();
    if (trimmed.length <= 12) {
        return trimmed;
    }
    return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
}
function extractCharset(contentType) {
    if (!contentType) {
        return undefined;
    }
    const charsetMatch = /charset\s*=\s*([^;]+)/i.exec(contentType);
    const rawCharset = charsetMatch?.[1];
    if (!rawCharset) {
        return undefined;
    }
    const normalized = rawCharset.trim().replace(/^"(.+)"$/, "$1").toLowerCase();
    return normalized.length > 0 ? normalized : undefined;
}
function isJsonContentType(contentType) {
    const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
    if (!mediaType) {
        return false;
    }
    return mediaType === "application/json" || mediaType.endsWith("+json");
}
//# sourceMappingURL=laviyaApiClient.js.map