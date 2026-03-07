import { setTimeout as delay } from "node:timers/promises";
import type { GlobalConfig } from "../config/loadGlobalConfig.js";
import type { Logger } from "../utils/logger.js";

interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  idempotencyKey?: string;
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
  constructor(private readonly options: LaviyaApiClientOptions) {}

  async getMyWork(params: { runId?: number; projectId?: number; agentProfile?: string }): Promise<unknown> {
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

  async refreshExecutionLease(params: {
    runId: number;
    taskId: number;
    executionId?: number;
  }): Promise<unknown> {
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
    } catch (error: unknown) {
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

  async completeExecution(payload: unknown, idempotencyKey: string): Promise<unknown> {
    return this.request({
      method: "POST",
      path: "/api/ai/CompleteExecution",
      body: payload,
      idempotencyKey
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

  private async requestOnce(options: RequestOptions, attempt: number): Promise<unknown> {
    const url = this.buildUrl(options.path, options.query);
    const headers: Record<string, string> = {
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
        throw new LaviyaApiError(
          `Laviya API error ${response.status} on ${options.path}`,
          response.status,
          parsedBody
        );
      }

      return parsedBody;
    } catch (error: unknown) {
      if (isAbortError(error)) {
        throw new LaviyaApiError(`Request timeout after ${this.options.requestTimeoutSeconds}s on ${options.path}`);
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

  private shouldRetry(error: unknown, attempt: number): boolean {
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

  private computeBackoff(attempt: number): number {
    const exp = Math.min(this.options.retry.maxDelayMs, this.options.retry.baseDelayMs * 2 ** (attempt - 1));
    if (!this.options.retry.jitter) {
      return exp;
    }
    const jitter = Math.floor(Math.random() * 250);
    return Math.min(this.options.retry.maxDelayMs, exp + jitter);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
