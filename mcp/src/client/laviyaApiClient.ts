import { setTimeout as delay } from "node:timers/promises";
import type { GlobalConfig } from "../config/loadGlobalConfig.js";
import type { Logger } from "../utils/logger.js";

interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  idempotencyKey?: string;
  timeoutSeconds?: number;
}

export interface LaviyaApiClientOptions {
  baseUrl: string;
  apiKey: string;
  agentUid?: string;
  auth: GlobalConfig["auth"];
  retry: GlobalConfig["retry"];
  requestTimeoutSeconds: number;
  logger: Logger;
}

export class LaviyaApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "LaviyaApiError";
  }
}

export class LaviyaApiClient {
  private capturedAgentUid: string | undefined;

  constructor(private readonly options: LaviyaApiClientOptions) {}

  async getMyWork(params: {
    runId?: number;
    projectId?: number;
    agentProfile?: string;
    includeFileBytes?: boolean;
    previousLogsLimit?: number;
  }): Promise<unknown> {
    const response = await this.request({
      method: "GET",
      path: "/api/ai/GetMyWork",
      query: {
        RunID: params.runId,
        ProjectID: params.projectId,
        AgentProfile: params.agentProfile,
        IncludeFileBytes:
          params.includeFileBytes === undefined ? undefined : params.includeFileBytes ? "true" : "false",
        PreviousLogsLimit: params.previousLogsLimit
      }
    });

    this.captureAgentUid(response);
    return response;
  }

  async startExecution(params: { runId: number; taskId: number; executionId?: number }): Promise<unknown> {
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

  async completeExecution(payload: unknown, idempotencyKey: string): Promise<unknown> {
    return this.request({
      method: "POST",
      path: "/api/ai/CompleteExecution",
      body: payload,
      idempotencyKey,
      timeoutSeconds: Math.max(120, this.options.requestTimeoutSeconds)
    });
  }

  async reportTokenUsage(payload: unknown, idempotencyKey?: string): Promise<unknown> {
    return this.request({
      method: "POST",
      path: "/api/ai/ReportTokenUsage",
      body: payload,
      idempotencyKey
    });
  }

  private async request(options: RequestOptions): Promise<unknown> {
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

  private async requestOnce(options: RequestOptions, attempt: number): Promise<unknown> {
    const url = this.buildUrl(options.path, options.query);
    const headers: Record<string, string> = {
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

      let parsedBody: unknown;
      try {
        parsedBody = await this.parseResponseBody(response);
      } catch (error: unknown) {
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
          parsedBody
        );
      }

      return parsedBody;
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
    }
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): URL {
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

  private async parseResponseBody(response: Response): Promise<unknown> {
    const raw = await response.text();
    if (!raw) {
      return {};
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(raw);
      } catch {
        return { raw };
      }
    }

    return { raw };
  }

  private shouldRetry(options: RequestOptions, error: unknown, attempt: number): boolean {
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

  private computeBackoff(attempt: number): number {
    const exp = Math.min(this.options.retry.maxDelayMs, this.options.retry.baseDelayMs * 2 ** (attempt - 1));
    if (!this.options.retry.jitter) {
      return exp;
    }
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(this.options.retry.maxDelayMs, exp + jitter);
  }

  private captureAgentUid(payload: unknown): void {
    const discoveredAgentUid = extractAgentUid(payload);
    if (!discoveredAgentUid) {
      return;
    }

    if (this.options.agentUid && this.options.agentUid !== discoveredAgentUid) {
      this.options.logger.warn(
        "GetMyWork response contains a different AIAgentUID than configured LAVIYA_AGENT_UID. Keeping configured value."
      );
      return;
    }

    if (this.capturedAgentUid === discoveredAgentUid) {
      return;
    }

    this.capturedAgentUid = discoveredAgentUid;
    this.options.logger.info("Captured AIAgentUID from GetMyWork response for follow-up requests.");
  }

  private resolveAgentUid(): string | undefined {
    return this.options.agentUid ?? this.capturedAgentUid;
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

function buildErrorContext(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return {
      error: String(error)
    };
  }

  const context: Record<string, unknown> = {
    error: error.message,
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
      context.cause = causeMessage;
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}
