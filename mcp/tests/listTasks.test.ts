import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { listTasks, listTasksInputSchema } from "../src/orchestration/listTasks.js";
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
      headers: new Headers(init?.headers)
    };
    requests.push(request);
    return handler(request, requests.length - 1);
  };
  return { requests, restore: () => { globalThis.fetch = originalFetch; } };
}

const page = { items: [{ taskID: 501, customTaskID: "LVY-501", title: "Add export" }], totalCount: 1, page: 1, pageSize: 25, hasMore: false };

test("lists tasks through api/ai/GetTasks with query filters and header auth", async () => {
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ hasFailed: true }, 503) : jsonResponse({ hasFailed: false, data: page }));

  try {
    const result = await listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({
      projectID: 4,
      assignedTo: "anyone",
      status: "Backlog, In Progress",
      search: "export",
      taskTypeIDs: [10, 30],
      page: 2,
      pageSize: 100,
      lite: true
    }));

    assert.deepEqual(result, page);
    assert.equal(requests.length, 2, "a safe GET is retried");
    const request = requests[1]!;
    assert.equal(request.method, "GET");
    assert.equal(request.url.pathname, "/api/ai/GetTasks");
    assert.deepEqual(Object.fromEntries(request.url.searchParams), {
      ProjectID: "4",
      AssignedTo: "anyone",
      Status: "Backlog, In Progress",
      Search: "export",
      TaskTypeIDs: "10,30",
      Page: "2",
      PageSize: "100",
      Lite: "true"
    });
    assert.equal(request.headers.get("X-API-Key"), "test-api-key");
    assert.equal(request.url.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("sends only the given filters so the backend defaults (me, open, 25) apply", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ hasFailed: false, data: page }));

  try {
    await listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({ lite: false }));

    assert.equal(requests[0]?.url.pathname, "/api/ai/GetTasks");
    assert.deepEqual([...requests[0]!.url.searchParams.keys()], []);
  } finally {
    restore();
  }
});

test("resolves a project name or task prefix through GetProjects", async () => {
  const projects = [
    { id: 4, name: "Laviya MVP", taskPrefix: "LVY" },
    { id: 9, name: "Laviya Mobile", taskPrefix: "LVM" }
  ];
  const { requests, restore } = installFetch((request) =>
    request.url.pathname === "/api/ai/GetProjects"
      ? jsonResponse({ hasFailed: false, data: request.url.searchParams.get("Search") === "Hyundai" ? [{ ID: 12, Name: "Hyundai Portal", TaskPrefix: "HYN" }] : projects })
      : jsonResponse({ hasFailed: false, data: page }));

  try {
    await listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({ project: "Hyundai" }));
    assert.equal(requests[0]?.url.searchParams.get("Search"), "Hyundai");
    assert.equal(requests[1]?.url.searchParams.get("ProjectID"), "12");

    // Several partial matches: an exact task prefix (or name) picks one.
    await listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({ project: "lvy" }));
    assert.equal(requests[3]?.url.searchParams.get("ProjectID"), "4");

    await assert.rejects(
      listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({ project: "Laviya" })),
      /matches 2 projects: Laviya MVP \(LVY\) projectID 4; Laviya Mobile \(LVM\) projectID 9/
    );
    assert.equal(requests.length, 5, "no task list request after an ambiguous project");
  } finally {
    restore();
  }
});

test("rejects an unknown project and conflicting project arguments", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ hasFailed: false, data: [] }));

  try {
    await assert.rejects(
      listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({ project: "Nope" })),
      /No project you can access matches "Nope"/
    );
    await assert.rejects(
      listTasks(createClient(), createLogger("error"), listTasksInputSchema.parse({ projectID: 4, project: "Laviya" })),
      /either projectID or project/
    );
    assert.equal(requests.length, 1);
  } finally {
    restore();
  }
});

test("validates list task inputs", () => {
  assert.equal(listTasksInputSchema.safeParse({}).success, true);
  assert.equal(listTasksInputSchema.safeParse({ pageSize: 101 }).success, false);
  assert.equal(listTasksInputSchema.safeParse({ page: 0 }).success, false);
  assert.equal(listTasksInputSchema.safeParse({ assignedTo: "team" }).success, false);
  assert.equal(listTasksInputSchema.safeParse({ taskTypeIDs: [11] }).success, false);
  assert.equal(listTasksInputSchema.safeParse({ projectID: 0 }).success, false);
  assert.equal(listTasksInputSchema.safeParse({ extra: true }).success, false);
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
