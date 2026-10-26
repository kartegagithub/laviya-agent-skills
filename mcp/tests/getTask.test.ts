import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { getTask, getTaskPayloadSchema } from "../src/orchestration/getTask.js";
import { createLogger } from "../src/utils/logger.js";

const retry = {
  maxAttempts: 3,
  baseDelayMs: 1,
  maxDelayMs: 2,
  jitter: false,
  retryOnHttpStatus: [500, 503]
};

const task = {
  taskID: 11262,
  customTaskID: "LVY-11262",
  title: "Footer padding",
  description: "Fix it.\n\n[image: /api/ai/GetFile?id=70]",
  attachments: [
    { fileID: 70, fileName: "../../shot?.png", isImage: true, downloadPath: "/api/ai/GetFile?id=70" },
    { fileID: 71, fileName: "spec.pdf", isImage: false, downloadPath: "/api/ai/GetFile?id=71" },
    { fileID: 72, fileName: "broken.png", isImage: true, downloadPath: "/api/ai/GetFile?id=72" }
  ]
};

function installFetch(handler: (url: URL, headers: Headers) => Response): { urls: URL[]; restore: () => void } {
  const originalFetch = globalThis.fetch;
  const urls: URL[] = [];
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    urls.push(url);
    return handler(url, new Headers(init?.headers));
  };
  return { urls, restore: () => { globalThis.fetch = originalFetch; } };
}

test("reads a task by code with header auth and without downloading by default", async () => {
  const { urls, restore } = installFetch((_url, headers) => {
    assert.equal(headers.get("X-API-Key"), "test-api-key");
    return jsonResponse({ HasFailed: false, Data: structuredClone(task) });
  });
  try {
    const result = await getTask(createClient(), createLogger("error"), getTaskPayloadSchema.parse({ taskID: "LVY-11262" })) as typeof task;

    assert.equal(result.title, "Footer padding");
    assert.equal(urls.length, 1);
    assert.equal(urls[0]?.pathname, "/api/ai/GetTask");
    assert.equal(urls[0]?.searchParams.get("TaskID"), "LVY-11262");
    assert.equal(urls[0]?.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("downloads image attachments with safe local names and reports failed files", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "laviya-get-task-"));
  const { urls, restore } = installFetch((url) => {
    if (url.pathname === "/api/ai/GetTask") return jsonResponse({ HasFailed: false, Data: structuredClone(task) });
    if (url.searchParams.get("id") === "72") return new Response("missing", { status: 404 });
    return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "Content-Type": "application/octet-stream" } });
  });
  try {
    const result = await getTask(createClient(), createLogger("error"), getTaskPayloadSchema.parse({ taskID: 11262, downloadAttachments: "images" }), root) as {
      attachments: Array<{ fileID: number; localPath?: string; downloadError?: string }>;
    };

    assert.deepEqual(urls.map((url) => url.searchParams.get("id")).filter(Boolean), ["70", "72"], "only images are downloaded");
    const [image, pdf, broken] = result.attachments;
    assert.equal(path.dirname(image?.localPath ?? ""), path.join(root, "LVY-11262"));
    assert.equal(path.basename(image?.localPath ?? ""), "70-shot_.png");
    assert.deepEqual([...await readFile(image?.localPath ?? "")], [1, 2, 3]);
    assert.equal(pdf?.localPath, undefined);
    assert.match(broken?.downloadError ?? "", /404/);
    assert.deepEqual(await readdir(path.join(root, "LVY-11262")), ["70-shot_.png"]);
  } finally {
    restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("validates get task payloads", () => {
  assert.equal(getTaskPayloadSchema.safeParse({ taskID: 0 }).success, false);
  assert.equal(getTaskPayloadSchema.safeParse({ taskID: "" }).success, false);
  assert.equal(getTaskPayloadSchema.safeParse({ taskID: 5, downloadAttachments: "some" }).success, false);
  assert.equal(getTaskPayloadSchema.safeParse({ taskID: "LVY-1", downloadAttachments: "all" }).success, true);
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
