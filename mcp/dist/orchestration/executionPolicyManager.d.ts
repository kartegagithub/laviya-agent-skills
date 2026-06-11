import type { z } from "zod";
import { type executionEvidenceSchema, type NormalizedExecutionPolicy } from "../contracts/executionPolicy.js";
type ExecutionEvidence = z.infer<typeof executionEvidenceSchema>;
export declare class ExecutionPolicyManager {
    private readonly policies;
    captureFromWorkItem(response: unknown): void;
    get(runId: number, taskId: number): NormalizedExecutionPolicy | undefined;
    validateCompletion(runId: number, taskId: number, evidence: ExecutionEvidence | undefined): void;
}
export {};
//# sourceMappingURL=executionPolicyManager.d.ts.map