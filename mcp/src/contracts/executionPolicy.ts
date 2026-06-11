import { z } from "zod";

export const executionPolicySchema = z
  .object({
    Version: z.number().int().positive().optional(),
    version: z.number().int().positive().optional(),
    Mode: z.string().min(1).optional(),
    mode: z.string().min(1).optional(),
    EnforcementMode: z.string().min(1).optional(),
    enforcementMode: z.string().min(1).optional(),
    AllowedCapabilities: z.array(z.string().min(1)).optional(),
    allowedCapabilities: z.array(z.string().min(1)).optional(),
    ForbiddenCapabilities: z.array(z.string().min(1)).optional(),
    forbiddenCapabilities: z.array(z.string().min(1)).optional(),
    WorkspaceWriteAllowed: z.boolean().optional(),
    workspaceWriteAllowed: z.boolean().optional(),
    ExecutionEvidenceRequired: z.boolean().optional(),
    executionEvidenceRequired: z.boolean().optional(),
    Instruction: z.string().optional(),
    instruction: z.string().optional()
  })
  .passthrough();

export const executionEvidenceSchema = z
  .object({
    performedCapabilities: z.array(z.string().min(1)).max(100).default([]),
    workspaceChanged: z.boolean(),
    changedFiles: z.array(z.string().min(1)).max(1_000).default([]),
    enforcementLevel: z.string().min(1).max(50).optional()
  })
  .strict()
  .superRefine((evidence, ctx) => {
    if (evidence.changedFiles.length > 0 && !evidence.workspaceChanged) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["workspaceChanged"],
        message: "workspaceChanged must be true when changedFiles is not empty."
      });
    }
  });

export interface NormalizedExecutionPolicy {
  version: number;
  mode: string;
  enforcementMode: string;
  allowedCapabilities: string[];
  forbiddenCapabilities: string[];
  workspaceWriteAllowed: boolean;
  executionEvidenceRequired: boolean;
  instruction: string;
}

export function normalizeExecutionPolicy(value: unknown): NormalizedExecutionPolicy | undefined {
  const parsed = executionPolicySchema.safeParse(value);
  if (!parsed.success) {
    return undefined;
  }

  const policy = parsed.data;
  const mode = policy.Mode ?? policy.mode;
  const enforcementMode = policy.EnforcementMode ?? policy.enforcementMode;
  const workspaceWriteAllowed =
    policy.WorkspaceWriteAllowed ?? policy.workspaceWriteAllowed;
  if (!mode || !enforcementMode || workspaceWriteAllowed === undefined) {
    return undefined;
  }

  return {
    version: policy.Version ?? policy.version ?? 1,
    mode: mode.toLowerCase(),
    enforcementMode: enforcementMode.toLowerCase(),
    allowedCapabilities:
      policy.AllowedCapabilities ?? policy.allowedCapabilities ?? [],
    forbiddenCapabilities:
      policy.ForbiddenCapabilities ?? policy.forbiddenCapabilities ?? [],
    workspaceWriteAllowed,
    executionEvidenceRequired:
      policy.ExecutionEvidenceRequired ?? policy.executionEvidenceRequired ?? false,
    instruction: policy.Instruction ?? policy.instruction ?? ""
  };
}
