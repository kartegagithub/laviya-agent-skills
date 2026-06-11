import { setTimeout as delay } from "node:timers/promises";
import type { RetryPolicyConfig } from "../config/loadGlobalConfig.js";
import { assertSecureBaseUrl } from "../utils/baseUrl.js";
import type { Logger } from "../utils/logger.js";
import {
  redactSecretValue,
  redactSensitiveText,
  summarizeIdentifier
} from "../utils/redaction.js";
import { parseLaviyaEnvelope } from "./envelope.js";
import {
  LaviyaApiError,
  LaviyaBusinessError,
  LaviyaProtocolError
} from "./errors.js";

interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  idempotencyKey?: string;
  timeoutSeconds?: number;
  contextRunId?: number;
  retryMode: "safe" | "idempotent" | "never";
}

const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024;
const MAX_RESPONSE_BODY_BYTES = 25 * 1024 * 1024;

export interface LaviyaApiClientOptions {
  baseUrl: string;
  apiKey: string;
  agentUid?: string;
  retry: RetryPolicyConfig;
  requestTimeoutSeconds: number;
  logger: Logger;
}

export class LaviyaApiClient {
  private readonly agentUidByRun = new Map<number, string>();
  private readonly initialAgentUid: string | undefined;
  private readonly activeControllers = new Set<AbortController>();
  private readonly shutdownController = new AbortController();
  private shuttingDown = false;

  constructor(private readonly options: LaviyaApiClientOptions) {
    assertSecureBaseUrl(options.baseUrl);
    this.initialAgentUid = options.agentUid;
  }

  async getMyWork(params: {
    runId?: number;
    projectId?: number;
    agentProfile?: string;
    includeFileBytes?: boolean;
    previousLogsLimit?: number;
  }): Promise<unknown> {
    return this.request({
      method: "GET",
      retryMode: "safe",
      path: "/api/ai/GetMyWork",
      query: {
        RunID: params.runId,
        ProjectID: params.projectId,
        AgentProfile: params.agentProfile,
        IncludeFileBytes:
          params.includeFileBytes === undefined ? undefined : params.includeFileBytes ? "true" : "false",
        PreviousLogsLimit: params.previousLogsLimit
      },
      contextRunId: params.runId
    });
  }

  async feedTask(params: { taskID: number }): Promise<unknown> {
    return this.request({
      method: "GET",
      retryMode: "safe",
      path: "/api/ai/FeedTask",
      query: {
        TaskID: params.taskID
      }
    });
  }

  async getLocalWorkStatus(params: { runId: number }): Promise<unknown> {
    return this.request({
      method: "GET",
      retryMode: "safe",
      path: "/api/ai/GetLocalWorkStatus",
      query: {
        RunID: params.runId
      },
      contextRunId: params.runId
    });
  }

  async cancelLocalWork(payload: unknown): Promise<unknown> {
    return this.request({
      method: "POST",
      retryMode: "never",
      path: "/api/ai/CancelLocalWork",
      body: payload,
      contextRunId: extractRunId(payload)
    });
  }

  async startExecution(params: { runId: number; taskId: number; executionId?: number }): Promise<unknown> {
    return this.request({
      method: "GET",
      retryMode: "safe",
      path: "/api/ai/StartExecution",
      query: {
        AIAgentFlowRunID: params.runId,
        TaskID: params.taskId,
        AIAgentTaskExecutionID: params.executionId
      },
      contextRunId: params.runId
    });
  }

  async addTaskComment(payload: unknown): Promise<unknown> {
    return this.request({
      method: "POST",
      retryMode: "never",
      path: "/api/ai/AddTaskComment",
      body: payload
    });
  }

  async completeExecution(payload: unknown, idempotencyKey: string): Promise<unknown> {
    return this.request({
      method: "POST",
      retryMode: "idempotent",
      path: "/api/ai/CompleteExecution",
      body: payload,
      idempotencyKey,
      timeoutSeconds: Math.max(120, this.options.requestTimeoutSeconds),
      contextRunId: extractRunId(payload)
    });
  }

  async reportTokenUsage(payload: unknown, idempotencyKey?: string): Promise<unknown> {
    return this.request({
      method: "POST",
      retryMode: idempotencyKey ? "idempotent" : "never",
      path: "/api/ai/ReportTokenUsage",
      body: payload,
      idempotencyKey,
      contextRunId: extractRunId(payload)
    });
  }

  shutdown(): void {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;
    this.shutdownController.abort();
    for (const controller of this.activeControllers) {
      controller.abort();
    }
    this.activeControllers.clear();
  }

  private async request(options: RequestOptions): Promise<unknown> {
    if (this.shuttingDown) {
      throw new LaviyaApiError("Laviya API client is shutting down.");
    }

    const maxAttempts = this.options.retry.maxAttempts;
    let attempt = 1;
    let lastError: unknown;

    while (attempt <= maxAttempts) {
      try {
        return await this.requestOnce(options, attempt);
      } catch (error: unknown) {
        lastError = error;
        const shouldRetry = this.shouldRetry(options, error, attempt);
        if (!shouldRetry) {
          throw error;
        }

        const wait = this.computeBackoff(attempt, error);
        const errorContext = buildErrorContext(error);
        this.options.logger.warn("Laviya API request failed, retrying", {
          path: options.path,
          attempt,
          waitMs: wait,
          ...errorContext
        });
        try {
          await delay(wait, undefined, { signal: this.shutdownController.signal });
        } catch (error: unknown) {
          if (isAbortError(error) && this.shuttingDown) {
            throw new LaviyaApiError("Laviya API retry cancelled during shutdown.");
          }
          throw error;
        }
        attempt += 1;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Laviya API request failed");
  }

  private async requestOnce(options: RequestOptions, attempt: number): Promise<unknown> {
    const activeAgentUid = this.resolveAgentUid(options.contextRunId);
    const url = this.buildUrl(options.path, options.query, activeAgentUid);
    const serializedBody = options.body === undefined ? undefined : JSON.stringify(options.body);
    if (serializedBody && Buffer.byteLength(serializedBody, "utf8") > MAX_REQUEST_BODY_BYTES) {
      throw new LaviyaProtocolError(
        `Request body exceeds the ${MAX_REQUEST_BODY_BYTES} byte limit on ${options.path}.`
      );
    }
    const headers: Record<string, string> = {};
    if (serializedBody !== undefined) {
      headers["Content-Type"] = "application/json; charset=utf-8";
    }

    if (options.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }

    const controller = new AbortController();
    this.activeControllers.add(controller);
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
        signal: controller.signal,
        redirect: "manual"
      });

      if (isRedirectStatus(response.status)) {
        throw new LaviyaApiError(
          `Redirect response ${response.status} refused on ${options.path}`,
          response.status
        );
      }

      let parsedBody: unknown;
      try {
        parsedBody = redactSecretValue(
          await this.parseResponseBody(response),
          this.options.apiKey
        );
      } catch (error: unknown) {
        if (error instanceof LaviyaProtocolError) {
          throw error;
        }
        const normalizedStatus = response.status >= 400 ? response.status : undefined;
        throw new LaviyaApiError(
          `Failed to read response body on ${options.path} (HTTP ${response.status})`,
          normalizedStatus,
          {
            responseStatus: response.status,
            ...buildErrorContext(error)
          }
        );
      }

      if (!response.ok) {
        throw new LaviyaApiError(
          `Laviya API error ${response.status} on ${options.path}`,
          response.status,
          parsedBody,
          parseRetryAfterMs(response.headers.get("retry-after"))
        );
      }

      const envelope = parseLaviyaEnvelope(parsedBody, options.path);
      this.captureAgentUid(envelope, options.path, options.contextRunId);
      return envelope;
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw new LaviyaApiError(`Request timeout after ${timeoutSeconds}s on ${options.path}`);
      }
      if (isTerminatedError(error)) {
        throw new LaviyaApiError(`Connection terminated on ${options.path}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      this.activeControllers.delete(controller);
    }
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | undefined>,
    activeAgentUid?: string
  ): URL {
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

  private async parseResponseBody(response: Response): Promise<unknown> {
    const raw = await this.readResponseBodyText(response);
    if (!raw) {
      return {};
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (isJsonContentType(contentType)) {
      try {
        return JSON.parse(raw);
      } catch {
        throw new LaviyaProtocolError("Laviya API returned malformed JSON.", { raw });
      }
    }

    throw new LaviyaProtocolError("Laviya API returned a non-JSON response.", {
      contentType,
      raw
    });
  }

  private async readResponseBodyText(response: Response): Promise<string> {
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BODY_BYTES) {
      throw new LaviyaProtocolError(
        `Response body exceeds the ${MAX_RESPONSE_BODY_BYTES} byte limit.`
      );
    }

    const bodyBuffer = await response.arrayBuffer();
    if (bodyBuffer.byteLength > MAX_RESPONSE_BODY_BYTES) {
      throw new LaviyaProtocolError(
        `Response body exceeds the ${MAX_RESPONSE_BODY_BYTES} byte limit.`
      );
    }
    if (bodyBuffer.byteLength === 0) {
      return "";
    }

    const charset = extractCharset(response.headers.get("content-type"));
    if (charset) {
      try {
        return new TextDecoder(charset).decode(bodyBuffer);
      } catch {
        this.options.logger.warn("Unsupported response charset. Falling back to UTF-8 decode.", { charset });
      }
    }

    return new TextDecoder("utf-8").decode(bodyBuffer);
  }

  private shouldRetry(options: RequestOptions, error: unknown, attempt: number): boolean {
    if (attempt >= this.options.retry.maxAttempts) {
      return false;
    }

    if (error instanceof LaviyaBusinessError || error instanceof LaviyaProtocolError) {
      return false;
    }

    if (options.retryMode === "never") {
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

  private computeBackoff(attempt: number, error: unknown): number {
    if (error instanceof LaviyaApiError && error.retryAfterMs !== undefined) {
      return Math.min(this.options.retry.maxDelayMs, error.retryAfterMs);
    }

    const exp = Math.min(this.options.retry.maxDelayMs, this.options.retry.baseDelayMs * 2 ** (attempt - 1));
    if (!this.options.retry.jitter) {
      return exp;
    }
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(this.options.retry.maxDelayMs, exp + jitter);
  }

  private captureAgentUid(payload: unknown, sourcePath: string, contextRunId?: number): void {
    const discoveredAgentUid = extractAgentUid(payload);
    if (!discoveredAgentUid) {
      return;
    }

    const runId = contextRunId ?? extractRunId(payload);
    if (!runId) {
      this.options.logger.warn("Ignored AIAgentUID from response because no run context was available.", {
        sourcePath,
        agentUid: summarizeAgentUid(discoveredAgentUid)
      });
      return;
    }

    const previousAgentUid = this.agentUidByRun.get(runId);
    if (previousAgentUid === discoveredAgentUid) {
      return;
    }
    this.agentUidByRun.set(runId, discoveredAgentUid);

    if (!previousAgentUid) {
      this.options.logger.info("Captured AIAgentUID for run context.", {
        sourcePath,
        runId,
        agentUid: summarizeAgentUid(discoveredAgentUid)
      });
      return;
    }

    this.options.logger.info("Detected AIAgentUID change from API response and switched active agent context.", {
      sourcePath,
      runId,
      previousAgentUid: summarizeAgentUid(previousAgentUid),
      activeAgentUid: summarizeAgentUid(discoveredAgentUid)
    });
  }

  private resolveAgentUid(runId?: number): string | undefined {
    return (runId ? this.agentUidByRun.get(runId) : undefined) ?? this.initialAgentUid;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function isTerminatedError(error: unknown): boolean {
  return error instanceof Error && /terminated/i.test(error.message);
}

function resolveTimeoutSeconds(options: RequestOptions, defaultTimeoutSeconds: number): number {
  if (options.timeoutSeconds && Number.isFinite(options.timeoutSeconds) && options.timeoutSeconds > 0) {
    return options.timeoutSeconds;
  }

  return defaultTimeoutSeconds;
}

function extractAgentUid(payload: unknown): string | undefined {
  const root = asRecord(payload);
  const candidates: unknown[] = [payload];

  if (root) {
    candidates.push(root.Data, root.data);
  }

  for (const candidate of candidates) {
    const record = asRecord(candidate);
    if (!record) {
      continue;
    }

    const uid =
      toNonEmptyString(record.AIAgentUID) ??
      toNonEmptyString(record.aiAgentUID) ??
      toNonEmptyString(record.AgentUID) ??
      toNonEmptyString(record.agentUID);

    if (uid) {
      return uid;
    }
  }

  return undefined;
}

function extractRunId(payload: unknown): number | undefined {
  const root = asRecord(payload);
  const candidates: unknown[] = [payload];
  if (root) {
    candidates.push(root.Data, root.data);
  }

  for (const candidate of candidates) {
    const record = asRecord(candidate);
    if (!record) {
      continue;
    }

    const runId =
      toPositiveInteger(record.aiAgentFlowRunID) ??
      toPositiveInteger(record.AIAgentFlowRunID) ??
      toPositiveInteger(record.runID) ??
      toPositiveInteger(record.RunID) ??
      toPositiveInteger(record.runId);
    if (runId) {
      return runId;
    }
  }

  return undefined;
}

function buildErrorContext(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return {
      error: redactSensitiveText(String(error))
    };
  }

  const context: Record<string, unknown> = {
    error: redactSensitiveText(error.message),
    errorName: error.name
  };

  const errorCode = extractCode(error);
  if (errorCode) {
    context.errorCode = errorCode;
  }

  const cause = asRecord((error as Error & { cause?: unknown }).cause);
  if (cause) {
    const causeMessage = toNonEmptyString(cause.message);
    if (causeMessage) {
      context.cause = redactSensitiveText(causeMessage);
    }

    const causeCode = extractCode(cause);
    if (causeCode) {
      context.causeCode = causeCode;
    }
  }

  return context;
}

function extractCode(value: unknown): string | undefined {
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

function toNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toPositiveInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function summarizeAgentUid(value: string): string {
  return summarizeIdentifier(value);
}

function isRedirectStatus(status: number): boolean {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

function extractCharset(contentType: string | null): string | undefined {
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

function isJsonContentType(contentType: string): boolean {
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase();
  if (!mediaType) {
    return false;
  }

  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1_000);
  }

  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return undefined;
}
