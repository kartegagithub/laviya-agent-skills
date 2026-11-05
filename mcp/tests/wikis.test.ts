import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import {
  createWiki,
  createWikiPayloadSchema,
  getWiki,
  getWikiInputSchema,
  listWikis,
  listWikisInputSchema,
  updateWiki,
  updateWikiPayloadSchema
} from "../src/orchestration/wikis.js";
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

test("lists wikis through api/ai/GetWikis with header auth", async () => {
  const wikis = [{ ID: 812, Name: "Payment integration", ParentWikiID: null, ChildCount: 2 }];
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: wikis }));

  try {
    const result = await listWikis(createClient(), createLogger("error"), listWikisInputSchema.parse({ projectID: 3, search: "payment", parentWikiID: 0 }));

    assert.deepEqual(result, wikis);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetWikis");
    assert.equal(requests[0]?.url.searchParams.get("ProjectID"), "3");
    assert.equal(requests[0]?.url.searchParams.get("Search"), "payment");
    assert.equal(requests[0]?.url.searchParams.get("ParentWikiID"), "0");
    assert.equal(requests[0]?.headers.get("X-API-Key"), "test-api-key");
    assert.equal(requests[0]?.url.searchParams.has("apiKey"), false);
  } finally {
    restore();
  }
});

test("resolves the wiki project by name or task prefix through GetProjects", async () => {
  const { requests, restore } = installFetch((request) => request.url.pathname === "/api/ai/GetProjects"
    ? jsonResponse({ HasFailed: false, Data: [{ ID: 3, Name: "Hyundai", TaskPrefix: "HYU" }, { ID: 4, Name: "Hyundai Mobile", TaskPrefix: "HYM" }] })
    : jsonResponse({ HasFailed: false, Data: [] }));

  try {
    await listWikis(createClient(), createLogger("error"), listWikisInputSchema.parse({ project: "hyundai" }));

    assert.equal(requests[0]?.url.pathname, "/api/ai/GetProjects");
    assert.equal(requests[1]?.url.pathname, "/api/ai/GetWikis");
    assert.equal(requests[1]?.url.searchParams.get("ProjectID"), "3", "the exact name wins over the partial match");
    assert.equal(requests[1]?.url.searchParams.has("ParentWikiID"), false);
  } finally {
    restore();
  }

  await assert.rejects(listWikis(createClient(), createLogger("error"), listWikisInputSchema.parse({})), /projectID or project is required/);
  await assert.rejects(listWikis(createClient(), createLogger("error"), listWikisInputSchema.parse({ projectID: 3, project: "Hyundai" })), /either projectID or project/);
});

test("reads a wiki through api/ai/GetWiki", async () => {
  const wiki = { ID: 812, Name: "Payment integration", Content: "Overview" };
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: false, Data: wiki }));

  try {
    const result = await getWiki(createClient(), createLogger("error"), getWikiInputSchema.parse({ wikiID: 812 }));

    assert.deepEqual(result, wiki);
    assert.equal(requests[0]?.method, "GET");
    assert.equal(requests[0]?.url.pathname, "/api/ai/GetWiki");
    assert.equal(requests[0]?.url.searchParams.get("WikiID"), "812");
  } finally {
    restore();
  }
});

test("creates a wiki through api/ai/CreateWiki with a stable request key and retries it", async () => {
  const wiki = { ID: 812, Name: "Payment integration", IsExisting: false };
  const { requests, restore } = installFetch((_request, index) =>
    index === 0 ? jsonResponse({ HasFailed: true }, 503) : jsonResponse({ HasFailed: false, Data: wiki }));

  try {
    const payload = { approvedByUser: true, projectID: 3, parentWikiID: 700, name: "Payment integration", content: "Overview\nSteps", relatedTaskIDs: [501] };
    const result = await createWiki(createClient(), createLogger("error"), createWikiPayloadSchema.parse(payload));
    await createWiki(createClient(), createLogger("error"), createWikiPayloadSchema.parse(payload));

    assert.deepEqual(result, wiki);
    assert.equal(requests.length, 3, "idempotent by name on the backend, so a failed attempt is retried");
    assert.equal(requests[0]?.method, "POST");
    assert.equal(requests[0]?.url.pathname, "/api/ai/CreateWiki");
    const { requestKey, ...body } = requests[0]?.body ?? {};
    assert.deepEqual(body, { projectID: 3, parentWikiID: 700, name: "Payment integration", content: "Overview\nSteps", relatedTaskIDs: [501] });
    assert.match(String(requestKey), /^lvy-[0-9a-f]{32}$/);
    assert.deepEqual(requests[1]?.body, requests[0]?.body);
    assert.equal(requests[2]?.body.requestKey, requestKey, "the same request gets the same key");
  } finally {
    restore();
  }
});

test("updates a wiki through api/ai/UpdateWiki and never retries an append", async () => {
  const { requests, restore } = installFetch(() => jsonResponse({ HasFailed: true }, 503));

  try {
    await assert.rejects(updateWiki(createClient(), createLogger("error"),
      updateWikiPayloadSchema.parse({ approvedByUser: true, wikiID: 812, content: "More", mode: "append" })));
    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.url.pathname, "/api/ai/UpdateWiki");
    assert.deepEqual(requests[0]?.body, { wikiID: 812, content: "More", mode: "append" });

    await assert.rejects(updateWiki(createClient(), createLogger("error"),
      updateWikiPayloadSchema.parse({ approvedByUser: true, wikiID: 812, name: "Payments" })));
    assert.equal(requests.length, 4, "replace and rename are retried");
    assert.deepEqual(requests[1]?.body, { wikiID: 812, name: "Payments", mode: "replace" });
  } finally {
    restore();
  }
});

test("rejects invalid wiki payloads before calling Laviya", async () => {
  assert.equal(listWikisInputSchema.safeParse({ projectID: 0 }).success, false);
  assert.equal(listWikisInputSchema.safeParse({ projectID: 3, parentWikiID: -1 }).success, false);
  assert.equal(getWikiInputSchema.safeParse({ wikiID: 0 }).success, false);

  const wiki = { approvedByUser: true, projectID: 3, name: "Doc" };
  assert.equal(createWikiPayloadSchema.safeParse(wiki).success, true);
  assert.equal(createWikiPayloadSchema.safeParse({ ...wiki, approvedByUser: false }).success, false);
  assert.equal(createWikiPayloadSchema.safeParse({ ...wiki, name: "  " }).success, false);
  assert.equal(createWikiPayloadSchema.safeParse({ ...wiki, name: "x".repeat(256) }).success, false);
  assert.equal(createWikiPayloadSchema.safeParse({ ...wiki, relatedTaskIDs: Array.from({ length: 51 }, (_, i) => i + 1) }).success, false);
  assert.equal(createWikiPayloadSchema.safeParse({ ...wiki, parentWikiID: 0 }).success, false);
  assert.equal(createWikiPayloadSchema.safeParse({ ...wiki, extra: 1 }).success, false);

  const update = { approvedByUser: true, wikiID: 812, content: "x" };
  assert.equal(updateWikiPayloadSchema.safeParse(update).success, true);
  assert.equal(updateWikiPayloadSchema.safeParse({ ...update, approvedByUser: undefined }).success, false);
  assert.equal(updateWikiPayloadSchema.safeParse({ ...update, mode: "merge" }).success, false);
  await assert.rejects(updateWiki(createClient(), createLogger("error"), updateWikiPayloadSchema.parse({ approvedByUser: true, wikiID: 812 })),
    /name or content is required/);
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
