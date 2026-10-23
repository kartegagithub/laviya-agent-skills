import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import {
  completeTaskWork,
  completeTaskWorkPayloadSchema,
  startDeliveryRun,
  startDeliveryRunPayloadSchema,
  startTaskWork,
  startTaskWorkPayloadSchema
} from "../src/orchestration/taskWork.js";
import { createLogger } from "../src/utils/logger.js";

const retry = {
  maxAttempts: 3,
  baseDelayMs: 1,
  maxDelayMs: 2,
  jitter: false,
  retryOnHttpStatus: [500, 503]
};

interface CapturedRequest {
  url: URL;
  headers: Headers;
  body: Record<string, unknown>;
}

function installFetch(handler: (request: CapturedRequest, index: number) => Response): {
  requests: CapturedRequest[];
  restore: () => void;
} {
  const originalFetch = globalThis.fetch;
  const requests: CapturedRequest[] = [];
  globalThis.fetch = async (input, init) => {
    const request: CapturedRequest = {
      url: new URL(input instanceof Request ? input.url : input.toString()),
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : {}
    };
    requests.push(request);
    return handler(request, requests.length - 1);
  };
  return { requests, restore: () => { globalThis.fetch = originalFetch; } };
}

const session = {
  SessionID: 77,
  TaskID: 501,
  CustomTaskID: "LVY-501",
  IsReplay: false,
  DurationMinutes: 42.5,
  Status: { ID: 13, Name: "Ready for deploy" },
  TargetStatus: { ID: 13, Name: "Ready for deploy" },
  EffortRecorded: true,
  StatusChanged: true,
  TaskCommentID: 900,
  DesignReferences: [
    {
      Provider: "Figma",
      LinkType: "Design",
      Url: "https://www.figma.com/design/AbC123/Checkout?node-id=1-2",
      EmbedUrl: "https://embed.figma.com/design/AbC123/Checkout?node-id=1-2&embed-host=laviya",
      Title: "Checkout",
      FigmaFileKey: "AbC123",
      FigmaNodeID: "1:2"
    }
  ]
};

test("starts and completes measured task work through api/ai", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: session }));

  try {
    const started = await startTaskWork(createClient(), createLogger("error"), startTaskWorkPayloadSchema.parse({ taskID: 501 }));
    const completed = await completeTaskWork(createClient(), createLogger("error"), completeTaskWorkPayloadSchema.parse({
      taskID: 501,
      sessionID: 77,
      comment: "Implemented export.\nTests pass.",
      targetStatus: "Ready for deploy"
    }));

    assert.deepEqual(started, session);
    assert.deepEqual(completed, session);
    assert.equal(requests[0]?.url.pathname, "/api/ai/StartTaskWork");
    assert.deepEqual(requests[0]?.body, { taskID: 501 });
    assert.equal(requests[1]?.url.pathname, "/api/ai/CompleteTaskWork");
    assert.equal(requests[1]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[1]?.url.searchParams.has("apiKey"), false);
    assert.deepEqual(
      { ...requests[1]?.body, requestKey: undefined },
      { taskID: 501, sessionID: 77, comment: "Implemented export.\nTests pass.", targetStatusName: "Ready for deploy", requestKey: undefined }
    );
    assert.match(String(requests[1]?.body.requestKey), /^lvy-[0-9a-f]{32}$/);
    assert.equal(requests[1]?.headers.get("Idempotency-Key"), requests[1]?.body.requestKey);
  } finally {
    restore();
  }
});

test("completion keys identify the session, so reworded retries resume it", async () => {
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: false }, 500) : jsonResponse({ HasFailed: false, Data: session })
  );

  try {
    const client = createClient();
    const logger = createLogger("error");
    await completeTaskWork(client, logger, completeTaskWorkPayloadSchema.parse({ taskID: 501, sessionID: 77, comment: "Done." }));
    await completeTaskWork(client, logger, completeTaskWorkPayloadSchema.parse({ taskID: 501, sessionID: 77, comment: "Done, reworded.", targetStatus: "Code Review" }));
    await completeTaskWork(client, logger, completeTaskWorkPayloadSchema.parse({ taskID: 501, sessionID: 78, comment: "Done." }));

    assert.equal(requests.length, 4);
    assert.equal(requests[0]?.body.requestKey, requests[1]?.body.requestKey, "retry after 500 keeps the key");
    assert.equal(requests[2]?.body.requestKey, requests[1]?.body.requestKey, "a reworded retry of the same session keeps the key");
    assert.notEqual(requests[3]?.body.requestKey, requests[1]?.body.requestKey, "a new work session gets a new key");
  } finally {
    restore();
  }
});

test("starts a delivery run for existing tasks and passes the run and late work end", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: { ID: 12, IsReplay: false } }));

  try {
    const client = createClient();
    const logger = createLogger("error");
    const run = await startDeliveryRun(client, logger, startDeliveryRunPayloadSchema.parse({ taskIDs: [501, 502, 501], title: "Export work" }));
    await startTaskWork(client, logger, startTaskWorkPayloadSchema.parse({ taskID: 501, deliveryRunID: 12 }));
    await completeTaskWork(client, logger, completeTaskWorkPayloadSchema.parse({ taskID: 501, sessionID: 77, workEndedAt: "2026-10-22T10:15:00+03:00" }));

    assert.deepEqual(run, { ID: 12, IsReplay: false });
    assert.equal(requests[0]?.url.pathname, "/api/ai/StartDeliveryRun");
    assert.deepEqual(requests[0]?.body, { taskIDs: [501, 502], title: "Export work" });
    assert.deepEqual(requests[1]?.body, { taskID: 501, deliveryRunID: 12 });
    assert.equal(requests[2]?.body.workEndedAt, "2026-10-22T10:15:00+03:00");
  } finally {
    restore();
  }
});

test("validates task work payloads", async () => {
  assert.equal(startDeliveryRunPayloadSchema.safeParse({ taskIDs: [] }).success, false);
  assert.equal(startDeliveryRunPayloadSchema.safeParse({ taskIDs: Array.from({ length: 101 }, (_, index) => index + 1) }).success, false);
  assert.equal(completeTaskWorkPayloadSchema.safeParse({ taskID: 1, sessionID: 2, workEndedAt: "yesterday" }).success, false);
  assert.equal(startTaskWorkPayloadSchema.safeParse({ taskID: 0 }).success, false);
  assert.equal(completeTaskWorkPayloadSchema.safeParse({ taskID: 1, sessionID: 2, hours: 2 }).success, false);
  assert.equal(completeTaskWorkPayloadSchema.safeParse({ taskID: 1, comment: "Done." }).success, false, "sessionID is required");
  await assert.rejects(
    completeTaskWork(createClient(), createLogger("error"), completeTaskWorkPayloadSchema.parse({ taskID: 1, sessionID: 2, targetStatus: "Done", methodologyStatusID: 5 })),
    /either targetStatus or methodologyStatusID/
  );
});

function createClient(): LaviyaApiClient {
  return new LaviyaApiClient({
    baseUrl: "https://api.example.test",
    apiKey: "test-api-key",
    retry,
    requestTimeoutSeconds: 5,
    logger: createLogger("error")
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
