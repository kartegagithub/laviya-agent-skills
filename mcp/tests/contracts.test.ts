import assert from "node:assert/strict";
import test from "node:test";
import { executionSummarySchema } from "../src/contracts/executionSummary.js";
import { tokenUsageSchema } from "../src/contracts/tokenUsage.js";
import {
  completeExecution,
  completeExecutionPayloadSchema
} from "../src/orchestration/completeExecution.js";
import type { LaviyaApiClient } from "../src/client/laviyaApiClient.js";
import type { RuntimeConfig } from "../src/config/mergeConfig.js";
import { createLogger } from "../src/utils/logger.js";
import { ExecutionPolicyManager } from "../src/orchestration/executionPolicyManager.js";

const validSummary = {
  stepRole: "implementation",
  task: {
    taskId: 10,
    runId: 20,
    stepIndex: 0
  },
  outcome: "success",
  deliverables: [],
  keyDecisions: [],
  assumptions: [],
  risks: [],
  handoff: {
    forNextStep: "",
    questions: [],
    artifacts: []
  }
};

test("validates the structured execution summary contract", () => {
  assert.equal(executionSummarySchema.parse(validSummary).outcome, "success");
  assert.throws(
    () => executionSummarySchema.parse({ ...validSummary, unexpected: true }),
    /Unrecognized key/
  );
});

test("completion sends a canonical result and rejects invalid output", async () => {
  let sent: unknown;
  const client = {
    completeExecution: async (payload: unknown) => {
      sent = payload;
      return { HasFailed: false };
    }
  } as unknown as LaviyaApiClient;
  const runtimeConfig = {
    completion: {
      requireExecutionSummary: true,
      autoFailOnMissingSummary: true,
      includeLogs: true,
      includeTokenUsage: false
    }
  } as RuntimeConfig;

  const payload = completeExecutionPayloadSchema.parse({
    taskID: 10,
    aiAgentFlowRunID: 20,
    aiAgentTaskExecutionID: 30,
    finalOutput: JSON.stringify({
      contractVersion: "1.0",
      outputType: "analysis_document",
      agentReportedStatus: "completed",
      payload: {
        title: "Analysis",
        summary: "Summary",
        sections: [{ title: "Finding", content: "Content" }]
      }
    })
  });
  await completeExecution(client, runtimeConfig, createLogger("error"), payload);
  const sentRecord = sent as Record<string, unknown>;
  assert.equal((sentRecord.canonicalResult as Record<string, unknown>).outputType, "analysis_document");
  assert.equal(sentRecord.aiAgentTaskExecutionID, 30);

  assert.throws(
    () => completeExecutionPayloadSchema.parse({ taskID: 10, aiAgentFlowRunID: 20, finalOutput: "{}" }),
    /aiAgentTaskExecutionID/
  );

  const invalidResultPayload = completeExecutionPayloadSchema.parse({
    taskID: 10,
    aiAgentFlowRunID: 20,
    aiAgentTaskExecutionID: 30,
    finalOutput: "not-json"
  });
  await completeExecution(client, runtimeConfig, createLogger("error"), invalidResultPayload);
  const invalidSent = sent as Record<string, unknown>;
  assert.equal(invalidSent.rawOutput, "not-json");
  assert.match(String(invalidSent.processingError), /E_RESULT_JSON_INVALID/);
  assert.equal(invalidSent.canonicalResult, undefined);
});

test("token usage validates measured records independently from completion", () => {
  assert.throws(() => tokenUsageSchema.parse({ measurement: "exact", model: "unknown", measurementSource: "provider" }), /at least one measured/);
  assert.throws(
    () =>
      tokenUsageSchema.parse({
        measurement: "exact",
        measurementSource: "provider",
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 20
      }),
    /must equal/
  );
  assert.deepEqual(
    tokenUsageSchema.parse({
      measurement: "exact",
      measurementSource: "provider",
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15
    }),
    {
      measurement: "exact",
      measurementSource: "provider",
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15
    }
  );
  assert.deepEqual(tokenUsageSchema.parse({ measurement: "unavailable" }), { measurement: "unavailable" });
});

test("enforces captured read-only execution policy", () => {
  const manager = new ExecutionPolicyManager();
  manager.captureFromWorkItem({
    HasFailed: false,
    Data: {
      AgentFlowRunID: 20,
      TaskID: 10,
      ExecutionPolicy: {
        Version: 1,
        Mode: "analysis",
        EnforcementMode: "enforce",
        AllowedCapabilities: ["read_workspace", "search_workspace"],
        ForbiddenCapabilities: ["write_workspace"],
        WorkspaceWriteAllowed: false,
        ExecutionEvidenceRequired: true,
        Instruction: "Analyze only."
      }
    }
  });

  assert.doesNotThrow(() =>
    manager.validateCompletion(20, 10, {
      performedCapabilities: ["read_workspace", "search_workspace"],
      workspaceChanged: false,
      changedFiles: []
    })
  );
  assert.throws(
    () =>
      manager.validateCompletion(20, 10, {
        performedCapabilities: ["write_workspace"],
        workspaceChanged: true,
        changedFiles: ["src/app.ts"]
      }),
    /Execution policy violation/
  );
  assert.throws(
    () => manager.validateCompletion(20, 10, undefined),
    /executionEvidence is required/
  );
});
