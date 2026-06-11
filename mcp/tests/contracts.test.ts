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

test("completion rejects summary identity and outcome mismatches", async () => {
  const client = {
    completeExecution: async () => ({ HasFailed: false })
  } as unknown as LaviyaApiClient;
  const runtimeConfig = {
    completion: {
      requireExecutionSummary: true,
      autoFailOnMissingSummary: true,
      includeLogs: true,
      includeTokenUsage: false
    }
  } as RuntimeConfig;

  const wrongOutcome = completeExecutionPayloadSchema.parse({
    taskID: 10,
    aiAgentFlowRunID: 20,
    isFailed: true,
    executionSummaryObject: validSummary
  });
  await assert.rejects(
    completeExecution(client, runtimeConfig, createLogger("error"), wrongOutcome),
    /outcome must be "failed"/
  );

  const wrongTask = completeExecutionPayloadSchema.parse({
    taskID: 11,
    aiAgentFlowRunID: 20,
    isFailed: false,
    executionSummaryObject: validSummary
  });
  await assert.rejects(
    completeExecution(client, runtimeConfig, createLogger("error"), wrongTask),
    /task identifiers must match/
  );

  const nonCompliantPolicy = completeExecutionPayloadSchema.parse({
    taskID: 10,
    aiAgentFlowRunID: 20,
    isFailed: false,
    executionSummaryObject: {
      ...validSummary,
      policyCompliance: {
        mode: "analysis",
        compliant: false,
        workspaceChanged: false,
        performedCapabilities: ["read_workspace"],
        notes: ["Policy violation detected."]
      }
    },
    executionEvidence: {
      performedCapabilities: ["read_workspace"],
      workspaceChanged: false,
      changedFiles: []
    }
  });
  await assert.rejects(
    completeExecution(client, runtimeConfig, createLogger("error"), nonCompliantPolicy),
    /compliant must be true/
  );
});

test("token usage remains optional but validates records when supplied", () => {
  const withoutUsage = completeExecutionPayloadSchema.parse({
    taskID: 10,
    aiAgentFlowRunID: 20,
    isFailed: false,
    executionSummary: "Completed."
  });
  assert.equal(withoutUsage.tokenUsages, undefined);

  assert.throws(() => tokenUsageSchema.parse({ model: "unknown" }), /at least one measured/);
  assert.throws(
    () =>
      tokenUsageSchema.parse({
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 20
      }),
    /must equal/
  );
  assert.deepEqual(
    tokenUsageSchema.parse({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15
    }),
    {
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15
    }
  );
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
