import { z } from "zod";
export declare const executionPolicySchema: z.ZodObject<{
    Version: z.ZodOptional<z.ZodNumber>;
    version: z.ZodOptional<z.ZodNumber>;
    Mode: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodString>;
    EnforcementMode: z.ZodOptional<z.ZodString>;
    enforcementMode: z.ZodOptional<z.ZodString>;
    AllowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    ForbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    forbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    WorkspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    workspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    ExecutionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    executionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    Instruction: z.ZodOptional<z.ZodString>;
    instruction: z.ZodOptional<z.ZodString>;
}, z.core.$loose>;
export declare const executionEvidenceSchema: z.ZodObject<{
    performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString>>;
    workspaceChanged: z.ZodBoolean;
    changedFiles: z.ZodDefault<z.ZodArray<z.ZodString>>;
    enforcementLevel: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
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
export declare function normalizeExecutionPolicy(value: unknown): NormalizedExecutionPolicy | undefined;
//# sourceMappingURL=executionPolicy.d.ts.map