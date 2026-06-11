import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { createLogger } from "../src/utils/logger.js";

const retry = {
  maxAttempts: 1,
  baseDelayMs: 50,
  maxDelayMs: 100,
  jitter: false,
  retryOnHttpStatus: [500, 503]
};

test("API client sends credentials only through query parameters", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl: URL | undefined;
  let capturedInit: RequestInit | undefined;

  globalThis.fetch = async (input, init) => {
    capturedUrl = new URL(input instanceof Request ? input.url : input.toString());
    capturedInit = init;
    return jsonResponse({ HasFailed: false, Data: { id: 42 } });
  };

  try {
    const apiKey = "key + / ? & = value";
    const agentUid = "agent-uid-1234567890";
    const client = createClient({ apiKey, agentUid });

    await client.startExecution({ runId: 10, taskId: 20 });

    assert.ok(capturedUrl);
    assert.equal(capturedUrl.searchParams.get("apiKey"), apiKey);
    assert.equal(capturedUrl.searchParams.get("agentUID"), agentUid);
    assert.equal(capturedUrl.searchParams.getAll("apiKey").length, 1);
    assert.equal(capturedUrl.searchParams.getAll("agentUID").length, 1);

    const headers = new Headers(capturedInit?.headers);
    assert.equal(headers.has("Authorization"), false);
    assert.equal(headers.has("X-API-Key"), false);
    assert.equal(headers.has("X-Agent-UID"), false);
    assert.equal(capturedInit?.redirect, "manual");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API client refuses redirects without forwarding query credentials", async () => {
  const originalFetch = globalThis.fetch;
  let callCount = 0;

  globalThis.fetch = async () => {
    callCount += 1;
    return new Response(null, {
      status: 302,
      headers: { Location: "https://other.example.test/collect" }
    });
  };

  try {
    const client = createClient();
    await assert.rejects(
      client.getLocalWorkStatus({ runId: 10 }),
      /Redirect response 302 refused/
    );
    assert.equal(callCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API client removes its API key from successful response payloads", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "secret-key-value";

  globalThis.fetch = async () =>
    jsonResponse({
      HasFailed: false,
      apiKey,
      Data: {
        callback: `https://example.test/result?apiKey=${encodeURIComponent(apiKey)}`
      }
    });

  try {
    const client = createClient({ apiKey });
    const result = await client.getLocalWorkStatus({ runId: 10 });
    const serialized = JSON.stringify(result);

    assert.equal(serialized.includes(apiKey), false);
    assert.match(serialized, /\*\*\*/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API client rejects insecure non-loopback base URLs", () => {
  assert.throws(
    () => createClient({ baseUrl: "http://api.example.test" }),
    /baseUrl must use HTTPS/
  );

  assert.doesNotThrow(() => createClient({ baseUrl: "http://localhost:5050" }));
});

test("keeps discovered agent identifiers isolated by run", async () => {
  const originalFetch = globalThis.fetch;
  const observed: Array<{ runId: string | null; agentUid: string | null }> = [];
  const callsByRun = new Map<string, number>();

  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const runId = url.searchParams.get("AIAgentFlowRunID") ?? "";
    observed.push({
      runId,
      agentUid: url.searchParams.get("agentUID")
    });
    const call = (callsByRun.get(runId) ?? 0) + 1;
    callsByRun.set(runId, call);

    return jsonResponse({
      HasFailed: false,
      Data: {
        AIAgentFlowRunID: Number(runId),
        AIAgentUID: `agent-for-run-${runId}`,
        id: Number(runId) * 100 + call
      }
    });
  };

  try {
    const client = createClient({ agentUid: "initial-agent" });
    await client.startExecution({ runId: 1, taskId: 10 });
    await client.startExecution({ runId: 2, taskId: 20 });
    await client.startExecution({ runId: 1, taskId: 10 });
    await client.startExecution({ runId: 2, taskId: 20 });

    assert.deepEqual(observed, [
      { runId: "1", agentUid: "initial-agent" },
      { runId: "2", agentUid: "initial-agent" },
      { runId: "1", agentUid: "agent-for-run-1" },
      { runId: "2", agentUid: "agent-for-run-2" }
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retries idempotent completion but not non-idempotent comments", async () => {
  const originalFetch = globalThis.fetch;
  let completionCalls = 0;
  let commentCalls = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith("/CompleteExecution")) {
      completionCalls += 1;
      if (completionCalls === 1) {
        return jsonResponse({ HasFailed: false }, 503);
      }
      return jsonResponse({ HasFailed: false, Data: true });
    }

    commentCalls += 1;
    return jsonResponse({ HasFailed: false }, 503);
  };

  try {
    const client = createClient({
      retry: {
        ...retry,
        maxAttempts: 2
      }
    });

    await client.completeExecution(
      { aiAgentFlowRunID: 1, taskID: 2 },
      "request-key"
    );
    await assert.rejects(
      client.addTaskComment({ taskID: 2, description: "test" }),
      /Laviya API error 503/
    );

    assert.equal(completionCalls, 2);
    assert.equal(commentCalls, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("shutdown aborts active requests and rejects new work", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    });

  try {
    const client = createClient();
    const pending = client.getLocalWorkStatus({ runId: 10 });
    await new Promise((resolve) => setImmediate(resolve));
    client.shutdown();

    await assert.rejects(pending, /Request timeout|shutting down|cancelled/i);
    await assert.rejects(
      client.getLocalWorkStatus({ runId: 10 }),
      /shutting down/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function createClient(
  overrides: Partial<ConstructorParameters<typeof LaviyaApiClient>[0]> = {}
): LaviyaApiClient {
  return new LaviyaApiClient({
    baseUrl: "https://api.example.test",
    apiKey: "test-api-key",
    retry,
    requestTimeoutSeconds: 5,
    logger: createLogger("error"),
    ...overrides
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
