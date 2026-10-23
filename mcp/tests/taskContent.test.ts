import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import { addTaskComment, addTaskCommentPayloadSchema } from "../src/orchestration/addTaskComment.js";
import { createTasksPayloadSchema } from "../src/orchestration/createTasks.js";
import {
  assignTask,
  assignTaskPayloadSchema,
  updateTaskDescription,
  updateTaskDescriptionPayloadSchema,
  uploadTaskFile,
  uploadTaskFilePayloadSchema
} from "../src/orchestration/taskContent.js";
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

async function withProjectFiles(run: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(tmpdir(), "laviya-task-content-"));
  try {
    await writeFile(path.join(root, "shot.png"), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    await writeFile(path.join(root, "notes.txt"), "hello");
    await writeFile(path.join(root, "page.html"), "<script></script>");
    await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("uploads a local file as base64 to the task without retrying", async () => {
  await withProjectFiles(async (root) => {
    const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false }, 500));
    try {
      await assert.rejects(uploadTaskFile(createClient(), createLogger("error"), root, uploadTaskFilePayloadSchema.parse({ taskID: 5, filePath: "shot.png" })));
      assert.equal(requests.length, 1, "uploads are never retried, a retry could store the file twice");
      assert.equal(requests[0]?.url.pathname, "/api/ai/UploadTaskFile");
      assert.deepEqual(requests[0]?.body, { taskID: 5, fileName: "shot.png", contentBase64: "iVBORw==" });
      assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
    } finally {
      restore();
    }
  });
});

test("rejects missing and script-capable files before calling the API", async () => {
  await withProjectFiles(async (root) => {
    const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: {} }));
    try {
      const client = createClient();
      const logger = createLogger("error");
      await assert.rejects(uploadTaskFile(client, logger, root, { taskID: 5, filePath: "page.html" }), /not an allowed task file/);
      await assert.rejects(uploadTaskFile(client, logger, root, { taskID: 5, filePath: "missing.png" }), /File not found/);
      await assert.rejects(
        updateTaskDescription(client, logger, root, updateTaskDescriptionPayloadSchema.parse({ taskID: 5, text: "x", filePaths: ["shot.png", "page.html"] })),
        /not an allowed task file/
      );
      await assert.rejects(updateTaskDescription(client, logger, root, { taskID: 5 }), /Pass text, filePaths or fileIDs/);
      assert.equal(requests.length, 0, "nothing is uploaded when any file of the call is invalid");
    } finally {
      restore();
    }
  });
});

test("uploads description and comment files first, then sends their fileIDs", async () => {
  await withProjectFiles(async (root) => {
    let nextFileID = 70;
    const { requests, restore } = installFetch((request) =>
      request.url.pathname === "/api/ai/UploadTaskFile"
        ? jsonResponse({ HasFailed: false, Data: { fileID: nextFileID++, isImage: true } })
        : jsonResponse({ HasFailed: false, Data: { taskID: 5 } })
    );
    try {
      const client = createClient();
      const logger = createLogger("error");
      await updateTaskDescription(client, logger, root, updateTaskDescriptionPayloadSchema.parse({ taskID: 5, text: "Mobile layout:", filePaths: ["shot.png"], fileIDs: [9] }));
      await addTaskComment(client, logger, addTaskCommentPayloadSchema.parse({ taskID: 5, filePaths: ["notes.txt"] }), root);

      assert.deepEqual(requests.map((request) => request.url.pathname), [
        "/api/ai/UploadTaskFile",
        "/api/ai/UpdateTaskDescription",
        "/api/ai/UploadTaskFile",
        "/api/ai/AddTaskComment"
      ]);
      assert.deepEqual(requests[1]?.body, { taskID: 5, text: "Mobile layout:", fileIDs: [70, 9] });
      assert.deepEqual(requests[3]?.body, { taskID: 5, fileIDs: [71] });
    } finally {
      restore();
    }
  });
});

test("assigns by e-mail and validates assignee payloads", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: { taskID: 5, assignees: [] } }));
  try {
    await assignTask(createClient(), createLogger("error"), assignTaskPayloadSchema.parse({ taskID: 5, assigneeEmails: ["dev@example.com"] }));
    await assignTask(createClient(), createLogger("error"), assignTaskPayloadSchema.parse({ taskID: 5 }));
    assert.equal(requests[0]?.url.pathname, "/api/ai/AddTaskAssignees");
    assert.deepEqual(requests[0]?.body, { taskID: 5, assigneeEmails: ["dev@example.com"] });
    assert.deepEqual(requests[1]?.body, { taskID: 5 });
  } finally {
    restore();
  }

  assert.equal(assignTaskPayloadSchema.safeParse({ taskID: 5, assigneeEmails: ["not-an-email"] }).success, false);
  assert.equal(createTasksPayloadSchema.safeParse({
    approvedByUser: true,
    projectID: 3,
    tasks: [{ title: "T", assigneeEmails: ["dev@example.com"] }]
  }).success, true);
  assert.equal(createTasksPayloadSchema.safeParse({
    approvedByUser: true,
    projectID: 3,
    tasks: [{ title: "T", assigneeEmails: ["x"] }]
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
