import type { z } from "zod";
import {
  normalizeExecutionPolicy,
  type executionEvidenceSchema,
  type NormalizedExecutionPolicy
} from "../contracts/executionPolicy.js";

type ExecutionEvidence = z.infer<typeof executionEvidenceSchema>;

export class ExecutionPolicyManager {
  private readonly policies = new Map<string, NormalizedExecutionPolicy>();

  captureFromWorkItem(response: unknown): void {
    const envelope = asRecord(response);
    const data = asRecord(envelope?.Data ?? envelope?.data);
    if (!data) {
      return;
    }

    const runId = positiveInteger(data.AgentFlowRunID ?? data.agentFlowRunID);
    const taskId = positiveInteger(data.TaskID ?? data.taskID);
    const policy = normalizeExecutionPolicy(data.ExecutionPolicy ?? data.executionPolicy);
    if (runId && taskId && policy) {
      this.policies.set(key(runId, taskId), policy);
    }
  }

  get(runId: number, taskId: number): NormalizedExecutionPolicy | undefined {
    return this.policies.get(key(runId, taskId));
  }

  validateCompletion(
    runId: number,
    taskId: number,
    evidence: ExecutionEvidence | undefined
  ): void {
    const policy = this.get(runId, taskId);
    if (!policy || policy.enforcementMode === "off") {
      return;
    }

    const violations: string[] = [];
    if (!evidence) {
      if (policy.executionEvidenceRequired) {
        violations.push("executionEvidence is required for this step.");
      }
    } else {
      if (
        !policy.workspaceWriteAllowed &&
        (evidence.workspaceChanged || evidence.changedFiles.length > 0)
      ) {
        violations.push("Workspace changes are forbidden for this step.");
      }

      const allowed = new Set(
        policy.allowedCapabilities.map((capability) => capability.toLowerCase())
      );
      const forbidden = evidence.performedCapabilities.filter(
        (capability) => !allowed.has(capability.toLowerCase())
      );
      if (forbidden.length > 0) {
        violations.push(
          `Performed capabilities are not allowed: ${Array.from(new Set(forbidden)).join(", ")}.`
        );
      }
    }

    if (violations.length > 0 && policy.enforcementMode === "enforce") {
      throw new Error(`Execution policy violation: ${violations.join(" ")}`);
    }
  }
}

function key(runId: number, taskId: number): string {
  return `${runId}:${taskId}`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}
