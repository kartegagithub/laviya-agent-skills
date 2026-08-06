import assert from "node:assert/strict";
import test from "node:test";
import { canonicalResultSchema } from "../src/contracts/canonicalResult.js";

test("accepts a canonical analysis document", () => {
  const parsed = canonicalResultSchema.parse({
    contractVersion: "1.0",
    outputType: "analysis_document",
    agentReportedStatus: "completed",
    payload: {
      title: "Auth analysis",
      summary: "Two risks found.",
      sections: [{ title: "Risks", content: "Token expiry is not checked." }]
    }
  });

  assert.equal(parsed.outputType, "analysis_document");
  assert.deepEqual(parsed.attachments, []);
});

test("rejects unknown versions, output types, and domain destinations", () => {
  for (const invalid of [
    { contractVersion: "2.0", outputType: "analysis_document", agentReportedStatus: "completed", payload: {} },
    { contractVersion: "1.0", outputType: "wiki", agentReportedStatus: "completed", payload: {} },
    { contractVersion: "1.0", outputType: "analysis_document", agentReportedStatus: "completed", payload: { title: "A", summary: "B", sections: [{ title: "C", content: "D" }] }, wiki: {} }
  ]) {
    assert.equal(canonicalResultSchema.safeParse(invalid).success, false);
  }
});

test("enforces output-specific consistency", () => {
  const invalidTest = canonicalResultSchema.safeParse({
    contractVersion: "1.0",
    outputType: "test_result",
    agentReportedStatus: "completed",
    payload: { summary: "tests", executed: 3, passed: 3, failed: 1, skipped: 0, criticalFailures: [] }
  });
  assert.equal(invalidTest.success, false);

  const invalidImplementation = canonicalResultSchema.safeParse({
    contractVersion: "1.0",
    outputType: "implementation_result",
    agentReportedStatus: "completed",
    payload: { summary: "done", changedFiles: [], tests: { executed: false, passed: true }, remainingIssues: [] }
  });
  assert.equal(invalidImplementation.success, false);
});
