import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { createTasks, createTasksPayloadSchema } from "../src/orchestration/createTasks.js";
import {
  assignTasksToProgressPayment,
  assignTasksToProgressPaymentPayloadSchema,
  listProgressPayments,
  listProgressPaymentsInputSchema
} from "../src/orchestration/progressPayments.js";
import { createLogger } from "../src/utils/logger.js";

const retry = {
  maxAttempts: 3,
  baseDelayMs: 1,
  maxDelayMs: 2,
  jitter: false,
  retryOnHttpStatus: [500, 503]
};

interface CapturedRequest {
  method: string;
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
      method: init?.method ?? "GET",
      url: new URL(input instanceof Request ? input.url : input.toString()),
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : {}
    };
    requests.push(request);
    return handler(request, requests.length - 1);
  };
  return { requests, restore: () => { globalThis.fetch = originalFetch; } };
}

test("lists progress payments through api/ai/GetProgressPayments with header auth", async () => {
  const progressPayments = [{ ID: 17, Name: "Kasım hakedişi", Code: "HK-11", EffortTrackingType: "ManualTaskSelection", IsAssignable: true, TaskCount: 4 }];
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: progressPayments }));

  try {
    const result = await listProgressPayments(createClient(), createLogger("error"), listProgressPaymentsInputSchema.parse({ projectID: 3, search: "Kasım" }));

    assert.deepEqual(result, progressPayments);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetProgressPayments");
    assert.equal(requests[0]?.url.searchParams.get("ProjectID"), "3");
    assert.equal(requests[0]?.url.searchParams.get("Search"), "Kasım");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("assigns tasks to a progress payment through api/ai/SetTaskProgressPayment and retries with the same body", async () => {
  const data = { ProgressPaymentID: 17, Tasks: [{ TaskID: 501, Result: "assigned" }] };
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: true }, 503) : jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await assignTasksToProgressPayment(createClient(), createLogger("error"),
      assignTasksToProgressPaymentPayloadSchema.parse({ approvedByUser: true, progressPaymentID: 17, taskIDs: [501, 502] }));
    await assignTasksToProgressPayment(createClient(), createLogger("error"),
      assignTasksToProgressPaymentPayloadSchema.parse({ approvedByUser: true, progressPaymentID: 17, taskIDs: [501], remove: true }));

    assert.deepEqual(result, data);
    assert.equal(requests[0]?.method, "POST");
    assert.equal(requests[0]?.url.pathname, "/api/ai/SetTaskProgressPayment");
    assert.deepEqual(requests[0]?.body, { progressPaymentID: 17, taskIDs: [501, 502], remove: false });
    assert.deepEqual(requests[1]?.body, requests[0]?.body, "the call sets a state, so a failed attempt is retried");
    assert.deepEqual(requests[2]?.body, { progressPaymentID: 17, taskIDs: [501], remove: true });
  } finally {
    restore();
  }
});

test("sends the progress payment of laviya_create_tasks", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: { Tasks: [] } }));

  try {
    const base = { approvedByUser: true, projectID: 3, tasks: [{ referenceID: "W-01", title: "Add export" }] };
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse(base));
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse({ ...base, progressPaymentID: 17 }));

    assert.equal("progressPaymentID" in (requests[0]?.body ?? {}), false);
    assert.equal(requests[1]?.body.progressPaymentID, 17);
    assert.notEqual(requests[1]?.body.requestKey, requests[0]?.body.requestKey);
  } finally {
    restore();
  }
});

test("rejects invalid progress payment payloads before calling Laviya", () => {
  assert.equal(listProgressPaymentsInputSchema.safeParse({}).success, false);
  assert.equal(listProgressPaymentsInputSchema.safeParse({ projectID: 0 }).success, false);
  assert.equal(listProgressPaymentsInputSchema.safeParse({ projectID: 3, search: " " }).success, false);

  const assign = { approvedByUser: true, progressPaymentID: 17, taskIDs: [501] };
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse(assign).success, true);
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse({ ...assign, approvedByUser: undefined }).success, false);
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse({ ...assign, approvedByUser: false }).success, false);
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse({ ...assign, taskIDs: [] }).success, false);
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse({ ...assign, taskIDs: Array.from({ length: 101 }, (_, i) => i + 1) }).success, false);
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse({ ...assign, progressPaymentID: -1 }).success, false);
  assert.equal(assignTasksToProgressPaymentPayloadSchema.safeParse({ ...assign, extra: 1 }).success, false);
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
