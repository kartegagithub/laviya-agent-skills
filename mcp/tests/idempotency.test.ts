import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalJson,
  generateCanonicalRequestKey
} from "../src/utils/canonicalJson.js";

test("canonical JSON is stable across object key order", () => {
  assert.equal(
    canonicalJson({ b: 2, a: { d: 4, c: 3 } }),
    canonicalJson({ a: { c: 3, d: 4 }, b: 2 })
  );
});

test("request keys change when any effectful payload field changes", () => {
  const base = {
    taskID: 10,
    aiAgentFlowRunID: 20,
    executionSummary: "done",
    tasks: [{ title: "One" }]
  };

  const first = generateCanonicalRequestKey("CompleteExecution", base);
  const reordered = generateCanonicalRequestKey("CompleteExecution", {
    tasks: [{ title: "One" }],
    executionSummary: "done",
    aiAgentFlowRunID: 20,
    taskID: 10
  });
  const changed = generateCanonicalRequestKey("CompleteExecution", {
    ...base,
    tasks: [{ title: "Two" }]
  });

  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});
