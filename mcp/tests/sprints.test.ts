import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { createTasks, createTasksPayloadSchema } from "../src/orchestration/createTasks.js";
import {
  assignTasksToSprint,
  assignTasksToSprintPayloadSchema,
  createSprint,
  createSprintPayloadSchema,
  listSprints,
  listSprintsInputSchema
} from "../src/orchestration/sprints.js";
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

test("lists sprints through api/ai/GetFolders with header auth", async () => {
  const folders = [{ ID: 42, Name: "Sprint 12", StartDate: "2026-11-09T00:00:00Z", TaskCount: 3 }];
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: folders }));

  try {
    const result = await listSprints(createClient(), createLogger("error"), listSprintsInputSchema.parse({ projectID: 3, search: "Sprint" }));

    assert.deepEqual(result, folders);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetFolders");
    assert.equal(requests[0]?.url.searchParams.get("ProjectID"), "3");
    assert.equal(requests[0]?.url.searchParams.get("Search"), "Sprint");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("creates a sprint through api/ai/CreateFolder and retries with the same body", async () => {
  const folder = { ID: 42, Name: "Sprint 12", IsExisting: false };
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: true }, 503) : jsonResponse({ HasFailed: false, Data: folder }));

  try {
    const result = await createSprint(createClient(), createLogger("error"), createSprintPayloadSchema.parse({
      approvedByUser: true,
      projectID: 3,
      name: "Sprint 12",
      startDate: "2026-11-09",
      endDate: "2026-11-20"
    }));

    assert.deepEqual(result, folder);
    assert.equal(requests.length, 2, "idempotent by name on the backend, so a failed attempt is retried");
    assert.equal(requests[0]?.method, "POST");
    assert.equal(requests[0]?.url.pathname, "/api/ai/CreateFolder");
    assert.deepEqual(requests[0]?.body, { projectID: 3, name: "Sprint 12", startDate: "2026-11-09", endDate: "2026-11-20" });
    assert.deepEqual(requests[1]?.body, requests[0]?.body);
  } finally {
    restore();
  }
});

test("assigns tasks to a sprint through api/ai/SetTaskFolders", async () => {
  const data = { FolderID: 42, Tasks: [{ TaskID: 501, Result: "added" }] };
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await assignTasksToSprint(createClient(), createLogger("error"),
      assignTasksToSprintPayloadSchema.parse({ approvedByUser: true, folderID: 42, taskIDs: [501, 502] }));
    await assignTasksToSprint(createClient(), createLogger("error"),
      assignTasksToSprintPayloadSchema.parse({ approvedByUser: true, folderID: 42, taskIDs: [501], remove: true }));

    assert.deepEqual(result, data);
    assert.equal(requests[0]?.url.pathname, "/api/ai/SetTaskFolders");
    assert.deepEqual(requests[0]?.body, { folderID: 42, taskIDs: [501, 502], remove: false });
    assert.deepEqual(requests[1]?.body, { folderID: 42, taskIDs: [501], remove: true });
  } finally {
    restore();
  }
});

test("sends the sprint folder of laviya_create_tasks and keeps old request keys", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: { Tasks: [] } }));

  try {
    const base = { approvedByUser: true, projectID: 3, tasks: [{ referenceID: "W-01", title: "Add export" }] };
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse(base));
    await createTasks(createClient(), createLogger("error"), createTasksPayloadSchema.parse({
      ...base,
      folderID: 42,
      tasks: [{ referenceID: "W-01", title: "Add export" }, { referenceID: "W-02", title: "Docs", folderID: 43 }]
    }));

    assert.equal("folderID" in (requests[0]?.body ?? {}), false);
    assert.equal(requests[1]?.body.folderID, 42);
    assert.deepEqual(requests[1]?.body.tasks, [
      { referenceID: "W-01", title: "Add export" },
      { referenceID: "W-02", title: "Docs", folderID: 43 }
    ]);
    assert.notEqual(requests[1]?.body.requestKey, requests[0]?.body.requestKey);
  } finally {
    restore();
  }
});

test("rejects invalid sprint payloads before calling Laviya", async () => {
  assert.equal(listSprintsInputSchema.safeParse({}).success, false);
  assert.equal(listSprintsInputSchema.safeParse({ projectID: 0 }).success, false);

  const sprint = { approvedByUser: true, projectID: 3, name: "Sprint 12" };
  assert.equal(createSprintPayloadSchema.safeParse(sprint).success, true);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, approvedByUser: false }).success, false);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, name: "  " }).success, false);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, name: "x".repeat(256) }).success, false);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, startDate: "09.11.2026" }).success, false);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, startDate: "2026-02-30" }).success, false);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, sortOrder: 0 }).success, false);
  assert.equal(createSprintPayloadSchema.safeParse({ ...sprint, extra: 1 }).success, false);
  await assert.rejects(
    createSprint(createClient(), createLogger("error"), createSprintPayloadSchema.parse({ ...sprint, startDate: "2026-11-20", endDate: "2026-11-09" })),
    /startDate must not be after endDate/
  );

  const assign = { approvedByUser: true, folderID: 42, taskIDs: [501] };
  assert.equal(assignTasksToSprintPayloadSchema.safeParse(assign).success, true);
  assert.equal(assignTasksToSprintPayloadSchema.safeParse({ ...assign, approvedByUser: undefined }).success, false);
  assert.equal(assignTasksToSprintPayloadSchema.safeParse({ ...assign, taskIDs: [] }).success, false);
  assert.equal(assignTasksToSprintPayloadSchema.safeParse({ ...assign, taskIDs: Array.from({ length: 101 }, (_, i) => i + 1) }).success, false);
  assert.equal(assignTasksToSprintPayloadSchema.safeParse({ ...assign, folderID: -1 }).success, false);

  const tasks = { approvedByUser: true, projectID: 3, tasks: [{ title: "T" }] };
  assert.equal(createTasksPayloadSchema.safeParse({ ...tasks, folderID: 0 }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({ ...tasks, tasks: [{ title: "T", folderID: 1.5 }] }).success, false);
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
