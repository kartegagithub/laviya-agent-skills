import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { createTasks, createTasksPayloadSchema } from "../src/orchestration/createTasks.js";
import {
  addTaskLink,
  addTaskLinkPayloadSchema,
  listTaskLinks,
  listTaskLinksPayloadSchema,
  removeTaskLink,
  removeTaskLinkPayloadSchema
} from "../src/orchestration/taskLinks.js";
import { createLogger } from "../src/utils/logger.js";

const retry = {
  maxAttempts: 3,
  baseDelayMs: 1,
  maxDelayMs: 2,
  jitter: false,
  retryOnHttpStatus: [500, 503]
};

const figmaUrl = "https://www.figma.com/design/AbCdEf1234567890/Checkout?node-id=12-34";

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

test("lists task links through api/ai/GetTaskLinks by task code with header auth", async () => {
  const data = { TaskID: 11262, CustomTaskID: "LVY-11262", Links: [{ ID: 845, Provider: "FIGMA", Url: figmaUrl }] };
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await listTaskLinks(createClient(), createLogger("error"), listTaskLinksPayloadSchema.parse({ taskID: "LVY-11262" }));

    assert.deepEqual(result, data);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetTaskLinks");
    assert.equal(requests[0]?.url.searchParams.get("TaskID"), "LVY-11262");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("adds a task link through api/ai/AddTaskLink and retries with the same body", async () => {
  const data = { TaskID: 11262, IsExisting: false, Link: { ID: 845, Provider: "FIGMA" } };
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: true }, 503) : jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await addTaskLink(createClient(), createLogger("error"),
      addTaskLinkPayloadSchema.parse({ approvedByUser: true, taskID: 11262, url: ` ${figmaUrl} ` }));

    assert.deepEqual(result, data);
    assert.equal(requests.length, 2, "a duplicate is returned as the existing link, so a failed attempt is retried");
    assert.equal(requests[0]?.method, "POST");
    assert.equal(requests[0]?.url.pathname, "/api/ai/AddTaskLink");
    assert.deepEqual(requests[0]?.body, { taskID: 11262, url: figmaUrl });
    assert.deepEqual(requests[1]?.body, requests[0]?.body);
  } finally {
    restore();
  }
});

test("removes a task link through api/ai/RemoveTaskLink without approvedByUser in the body", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: true }));

  try {
    const result = await removeTaskLink(createClient(), createLogger("error"),
      removeTaskLinkPayloadSchema.parse({ approvedByUser: true, taskID: 11262, linkID: 845 }));

    assert.equal(result, true);
    assert.equal(requests[0]?.url.pathname, "/api/ai/RemoveTaskLink");
    assert.deepEqual(requests[0]?.body, { taskID: 11262, linkID: 845 });
  } finally {
    restore();
  }
});

test("sends tasks[].links of laviya_create_tasks and keeps request keys of lists without links", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: { Tasks: [] } }));

  try {
    const base = { approvedByUser: true, projectID: 3, tasks: [{ referenceID: "W-01", title: "Checkout" }] };
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse(base));
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse({
      ...base,
      tasks: [{ referenceID: "W-01", title: "Checkout", links: [figmaUrl] }]
    }));

    assert.deepEqual(requests[0]?.body.tasks, [{ referenceID: "W-01", title: "Checkout" }]);
    assert.deepEqual(requests[1]?.body.tasks, [{ referenceID: "W-01", title: "Checkout", links: [figmaUrl] }]);
    assert.notEqual(requests[1]?.body.requestKey, requests[0]?.body.requestKey);
  } finally {
    restore();
  }
});

test("rejects invalid task link payloads before calling Laviya", () => {
  assert.equal(listTaskLinksPayloadSchema.safeParse({}).success, false);
  assert.equal(listTaskLinksPayloadSchema.safeParse({ taskID: 0 }).success, false);
  assert.equal(listTaskLinksPayloadSchema.safeParse({ taskID: 5, extra: 1 }).success, false);

  const add = { approvedByUser: true, taskID: 5, url: figmaUrl };
  assert.equal(addTaskLinkPayloadSchema.safeParse(add).success, true);
  assert.equal(addTaskLinkPayloadSchema.safeParse({ ...add, approvedByUser: false }).success, false);
  assert.equal(addTaskLinkPayloadSchema.safeParse({ ...add, taskID: "LVY-5" }).success, false);
  assert.equal(addTaskLinkPayloadSchema.safeParse({ ...add, url: "ftp://files.example.com/spec.pdf" }).success, false);
  assert.equal(addTaskLinkPayloadSchema.safeParse({ ...add, url: "not a url" }).success, false);
  assert.equal(addTaskLinkPayloadSchema.safeParse({ ...add, url: `https://example.com/${"x".repeat(2048)}` }).success, false);

  const remove = { approvedByUser: true, taskID: 5, linkID: 845 };
  assert.equal(removeTaskLinkPayloadSchema.safeParse(remove).success, true);
  assert.equal(removeTaskLinkPayloadSchema.safeParse({ ...remove, approvedByUser: undefined }).success, false);
  assert.equal(removeTaskLinkPayloadSchema.safeParse({ ...remove, linkID: 0 }).success, false);

  const tasks = { approvedByUser: true, projectID: 3 };
  assert.equal(createTasksPayloadSchema.safeParse({ ...tasks, tasks: [{ title: "T", links: [figmaUrl] }] }).success, true);
  assert.equal(createTasksPayloadSchema.safeParse({ ...tasks, tasks: [{ title: "T", links: ["ftp://x.example.com/a"] }] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({
    ...tasks,
    tasks: [{ title: "T", links: Array.from({ length: 11 }, (_, i) => `https://example.com/${i}`) }]
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
