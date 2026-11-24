import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { createTasks, createTasksPayloadSchema } from "../src/orchestration/createTasks.js";
import { listTags, listTagsInputSchema, updateTaskTags, updateTaskTagsPayloadSchema } from "../src/orchestration/taskTags.js";
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

test("lists tenant tags through api/ai/GetTags with the search filter", async () => {
  const data = [{ ID: 501, Name: "Frontend", ColorCode: "#3B82F6" }];
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await listTags(createClient(), createLogger("error"), listTagsInputSchema.parse({ search: " front " }));

    assert.deepEqual(result, data);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetTags");
    assert.equal(requests[0]?.url.searchParams.get("Search"), "front");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
  } finally {
    restore();
  }
});

test("updates task tags through api/ai/UpdateTaskTags, retries with the same body and sends remove false by default", async () => {
  const data = { TaskID: 11262, Remove: false, Results: [{ RequestedName: "frontEnd", Result: "added", IsNewTag: false }] };
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: true }, 503) : jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await updateTaskTags(createClient(), createLogger("error"),
      updateTaskTagsPayloadSchema.parse({ approvedByUser: true, taskID: 11262, tags: [" frontEnd ", "Mobil"] }));

    assert.deepEqual(result, data);
    assert.equal(requests.length, 2, "the call is idempotent, so a failed attempt is retried");
    assert.equal(requests[0]?.method, "POST");
    assert.equal(requests[0]?.url.pathname, "/api/ai/UpdateTaskTags");
    assert.deepEqual(requests[0]?.body, { taskID: 11262, tags: ["frontEnd", "Mobil"], remove: false });
    assert.deepEqual(requests[1]?.body, requests[0]?.body);
  } finally {
    restore();
  }
});

test("surfaces the typo rejection of the backend without retrying", async () => {
  const message = "Tags: 'Fronted' looks like a typo of the existing tag 'Frontend', so no tag was created and nothing was changed.";
  const { requests, restore } = installFetch(() =>
    jsonResponse({ HasFailed: true, Messages: [{ Description: message }] }, 422));

  try {
    await assert.rejects(
      updateTaskTags(createClient(), createLogger("error"),
        updateTaskTagsPayloadSchema.parse({ approvedByUser: true, taskID: 11262, tags: ["Fronted"] })),
      (error: Error) => error.message.includes("Frontend"));
    assert.equal(requests.length, 1);
  } finally {
    restore();
  }
});

test("sends tasks[].tags of laviya_create_tasks and keeps request keys of lists without tags", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: { Tasks: [] } }));

  try {
    const base = { approvedByUser: true, projectID: 3, tasks: [{ referenceID: "W-01", title: "Checkout" }] };
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse(base));
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse({
      ...base,
      tasks: [{ referenceID: "W-01", title: "Checkout", tags: ["Frontend"] }]
    }));

    assert.deepEqual(requests[0]?.body.tasks, [{ referenceID: "W-01", title: "Checkout" }]);
    assert.deepEqual(requests[1]?.body.tasks, [{ referenceID: "W-01", title: "Checkout", tags: ["Frontend"] }]);
    assert.notEqual(requests[1]?.body.requestKey, requests[0]?.body.requestKey);
  } finally {
    restore();
  }
});

test("rejects invalid tag payloads before calling Laviya", () => {
  assert.equal(listTagsInputSchema.safeParse({}).success, true);
  assert.equal(listTagsInputSchema.safeParse({ search: "" }).success, false);
  assert.equal(listTagsInputSchema.safeParse({ extra: 1 }).success, false);

  const update = { approvedByUser: true, taskID: 5, tags: ["Frontend"] };
  assert.equal(updateTaskTagsPayloadSchema.safeParse(update).success, true);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, remove: true }).success, true);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, approvedByUser: false }).success, false);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, taskID: "LVY-5" }).success, false);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, tags: [] }).success, false);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, tags: ["  "] }).success, false);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, tags: ["x".repeat(256)] }).success, false);
  assert.equal(updateTaskTagsPayloadSchema.safeParse({ ...update, tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }).success, false);

  const tasks = { approvedByUser: true, projectID: 3 };
  assert.equal(createTasksPayloadSchema.safeParse({ ...tasks, tasks: [{ title: "T", tags: ["QA"] }] }).success, true);
  assert.equal(createTasksPayloadSchema.safeParse({ ...tasks, tasks: [{ title: "T", tags: [""] }] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({
    ...tasks,
    tasks: [{ title: "T", tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }]
  }).success, false);
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
