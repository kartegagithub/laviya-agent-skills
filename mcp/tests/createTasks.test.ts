import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { createTasks, createTasksPayloadSchema, type CreateTasksPayload } from "../src/orchestration/createTasks.js";
import { listProjects } from "../src/orchestration/listProjects.js";
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

const createdData = {
  RequestKey: "k",
  IsReplay: false,
  ProjectID: 3,
  MethodologyStatusID: 11,
  Tasks: [
    { ReferenceID: "W-01", TaskID: 501, CustomTaskID: "LVY-501" },
    { ReferenceID: "W-02", TaskID: 502, CustomTaskID: "LVY-502", ParentTaskID: 501 }
  ]
};

test("posts the approved list to api/ai/CreateTasks with a deterministic request key", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: createdData }));

  try {
    const payload = parse({
      approvedByUser: true,
      projectID: 3,
      tasks: [
        { referenceID: "W-01", title: "Add export endpoint", description: "Return List<Row>.", priority: 2, estimatedEffortHours: 1.5 },
        { referenceID: "W-02", title: "Cover export endpoint", parentReferenceID: "w-01", taskTypeID: 10 },
        { title: "Update docs", parentTaskID: 42 }
      ]
    });
    const result = await createTasks(createClient(), createLogger("error"), payload);
    await createTasks(createClient(), createLogger("error"), payload);

    assert.deepEqual(result, createdData);
    assert.equal(requests.length, 2);
    const [first, second] = requests;
    assert.equal(first?.url.pathname, "/api/ai/CreateTasks");
    assert.equal(first?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(first?.url.searchParams.has("apiKey"), false);
    assert.deepEqual(first?.body.tasks, [
      { referenceID: "W-01", title: "Add export endpoint", description: "Return List<Row>.", priority: 2, estimatedEffort: 90 },
      { referenceID: "W-02", title: "Cover export endpoint", taskTypeID: 10, parentReferenceID: "w-01" },
      { referenceID: "3", title: "Update docs", parentTaskID: 42 }
    ]);
    assert.equal(first?.body.projectID, 3);
    assert.match(String(first?.body.requestKey), /^lvy-[0-9a-f]{32}$/);
    assert.equal(first?.headers.get("Idempotency-Key"), first?.body.requestKey);
    assert.equal(second?.body.requestKey, first?.body.requestKey, "the same approved list must reuse its key");

    const otherList = await createTasks(createClient(), createLogger("error"), parse({
      approvedByUser: true,
      projectID: 3,
      tasks: [{ referenceID: "W-01", title: "Something else" }]
    }));
    assert.deepEqual(otherList, createdData);
    assert.notEqual(requests[2]?.body.requestKey, first?.body.requestKey);
  } finally {
    restore();
  }
});

test("retries a failed attempt with the same request key and returns the replayed result", async () => {
  const { requests, restore } = installFetch((_request, index) =>
    index === 0
      ? jsonResponse({ HasFailed: true, Messages: [{ Description: "Connection reset" }] }, 503)
      : jsonResponse({ HasFailed: false, Data: { ...createdData, IsReplay: true } })
  );

  try {
    const result = await createTasks(createClient(), createLogger("error"), parse({
      approvedByUser: true,
      projectID: 3,
      requestKey: "approved-list-7",
      tasks: [{ referenceID: "W-01", title: "Add export endpoint" }]
    }));

    assert.equal((result as { IsReplay: boolean }).IsReplay, true);
    assert.equal(requests.length, 2);
    assert.deepEqual(requests.map((request) => request.body.requestKey), ["approved-list-7", "approved-list-7"]);
  } finally {
    restore();
  }
});

test("does not retry business rejections and shows the backend reason", async () => {
  const { requests, restore } = installFetch(() =>
    jsonResponse({ HasFailed: true, Messages: [{ Description: "RequestKey was already used with a different request." }] }, 422)
  );

  try {
    await assert.rejects(
      createTasks(createClient(), createLogger("error"), parse({ approvedByUser: true, projectID: 3, tasks: [{ title: "One" }] })),
      /422 on \/api\/ai\/CreateTasks: RequestKey was already used with a different request\./
    );
    assert.equal(requests.length, 1);
  } finally {
    restore();
  }
});

test("rejects invalid task lists before calling Laviya", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: createdData }));

  try {
    const client = createClient();
    const logger = createLogger("error");
    await assert.rejects(
      createTasks(client, logger, parse({ approvedByUser: true, projectID: 3, tasks: [{ referenceID: "a", title: "One" }, { referenceID: "A", title: "Two" }] })),
      /duplicated/
    );
    await assert.rejects(
      createTasks(client, logger, parse({ approvedByUser: true, projectID: 3, tasks: [{ title: "Child", parentReferenceID: "later" }, { referenceID: "later", title: "Parent" }] })),
      /earlier item/
    );
    await assert.rejects(
      createTasks(client, logger, parse({ approvedByUser: true, projectID: 3, tasks: [{ referenceID: "a", title: "One" }, { title: "Two", parentReferenceID: "a", parentTaskID: 4 }] })),
      /both parentTaskID and parentReferenceID/
    );
    assert.equal(requests.length, 0);
  } finally {
    restore();
  }

  assert.equal(createTasksPayloadSchema.safeParse({ tasks: [{ title: "One" }] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({ approvedByUser: true, tasks: [{ title: "One" }] }).success, false, "projectID is required");
  assert.equal(createTasksPayloadSchema.safeParse({ approvedByUser: false, tasks: [{ title: "One" }] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({ approvedByUser: true, tasks: [] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({ approvedByUser: true, tasks: [{ title: "One", taskTypeID: 5 }] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({ approvedByUser: true, tasks: [{ title: "One", estimatedEffort: 4 }] }).success, false);
});

test("lists accessible projects through api/ai/GetProjects", async () => {
  const projects = [{ ID: 3, Name: "Laviya Backend", TaskPrefix: "LVY", SpaceName: "Product" }];
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: projects }));

  try {
    assert.deepEqual(await listProjects(createClient(), createLogger("error"), { search: "backend" }), projects);
    assert.deepEqual(await listProjects(createClient(), createLogger("error"), {}), projects);
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetProjects");
    assert.equal(requests[0]?.url.searchParams.get("Search"), "backend");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
    assert.equal(requests[1]?.url.searchParams.has("Search"), false);
  } finally {
    restore();
  }
});

function parse(payload: unknown): CreateTasksPayload {
  return createTasksPayloadSchema.parse(payload);
}

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
