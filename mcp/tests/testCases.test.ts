import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import {
  createTestCases,
  createTestCasesPayloadSchema,
  listTestCases,
  listTestCasesPayloadSchema,
  reportTestResult,
  reportTestResultPayloadSchema
} from "../src/orchestration/testCases.js";
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

test("lists test cases through api/ai/GetTaskTestCases by task code with header auth", async () => {
  const data = { TaskID: 11262, CustomTaskID: "LVY-11262", TestCases: [{ ID: 5, ReferenceID: "TC-1", LastResult: "passed" }] };
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await listTestCases(createClient(), createLogger("error"), listTestCasesPayloadSchema.parse({ taskID: "LVY-11262" }));

    assert.deepEqual(result, data);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetTaskTestCases");
    assert.equal(requests[0]?.url.searchParams.get("TaskID"), "LVY-11262");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("saves test cases through api/ai/SaveTaskTestCases, joins steps and retries with the same body", async () => {
  const data = { TaskID: 11262, CreatedCount: 1, UpdatedCount: 0, TestCases: [{ ID: 5 }] };
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: true }, 503) : jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await createTestCases(createClient(), createLogger("error"), createTestCasesPayloadSchema.parse({
      approvedByUser: true,
      taskID: 11262,
      cases: [{ referenceID: " TC-1 ", title: "Login", steps: ["Open /login", "Submit"], expectedResult: "Dashboard opens" }]
    }));

    assert.deepEqual(result, data);
    assert.equal(requests.length, 2, "cases are upserted by referenceID, so a failed attempt is retried");
    assert.equal(requests[0]?.method, "POST");
    assert.equal(requests[0]?.url.pathname, "/api/ai/SaveTaskTestCases");
    assert.deepEqual(requests[0]?.body, {
      taskID: 11262,
      cases: [{ referenceID: "TC-1", title: "Login", steps: "Open /login\nSubmit", expectedResult: "Dashboard opens" }]
    });
    assert.deepEqual(requests[1]?.body, requests[0]?.body);
  } finally {
    restore();
  }
});

test("reports a test result after uploading evidence files and never retries it", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "laviya-test-cases-"));
  const { requests, restore } = installFetch((request) => {
    if (request.url.pathname === "/api/ai/UploadTaskFile") {
      return jsonResponse({ HasFailed: false, Data: { fileID: 70, fileName: "login.png" } });
    }
    return jsonResponse({ HasFailed: true }, 503);
  });

  try {
    await writeFile(path.join(root, "login.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const payload = reportTestResultPayloadSchema.parse({
      taskID: 11262,
      referenceID: "TC-1",
      result: "failed",
      evidence: "500 on submit",
      filePaths: ["login.png"],
      fileIDs: [71]
    });

    await assert.rejects(reportTestResult(createClient(), createLogger("error"), root, payload));
    const runs = requests.filter((request) => request.url.pathname === "/api/ai/AddTaskTestRun");
    assert.equal(runs.length, 1, "a run is appended on every call, so it is never retried");
    assert.deepEqual(runs[0]?.body, { taskID: 11262, referenceID: "TC-1", result: "failed", evidence: "500 on submit", evidenceFileIDs: [70, 71] });
  } finally {
    restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("reports a test result by testCaseID without files", async () => {
  const data = { ID: 9, TaskTestCaseID: 5, Result: "passed" };
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: data }));

  try {
    const result = await reportTestResult(createClient(), createLogger("error"), process.cwd(),
      reportTestResultPayloadSchema.parse({ taskID: 11262, testCaseID: 5, result: "passed" }));

    assert.deepEqual(result, data);
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0]?.body, { taskID: 11262, taskTestCaseID: 5, result: "passed" });
  } finally {
    restore();
  }
});

test("rejects invalid test case payloads before calling Laviya", async () => {
  assert.equal(listTestCasesPayloadSchema.safeParse({ taskID: 0 }).success, false);
  assert.equal(listTestCasesPayloadSchema.safeParse({ taskID: 5, extra: 1 }).success, false);

  const create = { approvedByUser: true, taskID: 5, cases: [{ referenceID: "TC-1", title: "Login" }] };
  assert.equal(createTestCasesPayloadSchema.safeParse(create).success, true);
  assert.equal(createTestCasesPayloadSchema.safeParse({ ...create, approvedByUser: false }).success, false);
  assert.equal(createTestCasesPayloadSchema.safeParse({ ...create, cases: [] }).success, false);
  assert.equal(createTestCasesPayloadSchema.safeParse({ ...create, cases: [{ title: "Login" }] }).success, false, "referenceID is required");
  assert.equal(createTestCasesPayloadSchema.safeParse({
    ...create,
    cases: Array.from({ length: 51 }, (_, i) => ({ referenceID: `TC-${i}`, title: "T" }))
  }).success, false);
  assert.equal(createTestCasesPayloadSchema.safeParse({
    ...create,
    cases: [{ referenceID: "TC-1", title: "Login", steps: Array.from({ length: 20 }, () => "x".repeat(600)) }]
  }).success, false, "joined steps must fit the backend's 10000 character limit");

  const report = { taskID: 5, testCaseID: 1, result: "passed" };
  assert.equal(reportTestResultPayloadSchema.safeParse(report).success, true);
  assert.equal(reportTestResultPayloadSchema.safeParse({ ...report, result: "ok" }).success, false);
  assert.equal(reportTestResultPayloadSchema.safeParse({ ...report, taskID: "LVY-5" }).success, false);

  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: {} }));
  try {
    for (const payload of [{ taskID: 5, result: "passed" }, { taskID: 5, testCaseID: 1, referenceID: "TC-1", result: "passed" }]) {
      await assert.rejects(
        reportTestResult(createClient(), createLogger("error"), process.cwd(), reportTestResultPayloadSchema.parse(payload)),
        /exactly one of testCaseID or referenceID/
      );
    }
    await assert.rejects(reportTestResult(createClient(), createLogger("error"), process.cwd(),
      reportTestResultPayloadSchema.parse({ ...report, filePaths: ["missing.png"] })), /File not found/);
    await assert.rejects(reportTestResult(createClient(), createLogger("error"), process.cwd(), reportTestResultPayloadSchema.parse({
      ...report,
      filePaths: Array.from({ length: 15 }, (_, i) => `missing-${i}.png`),
      fileIDs: Array.from({ length: 10 }, (_, i) => i + 1)
    })), /At most 20 evidence files/);
    assert.equal(requests.length, 0);
  } finally {
    restore();
  }
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
