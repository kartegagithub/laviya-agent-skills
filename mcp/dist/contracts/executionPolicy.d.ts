import { z } from "zod";
export declare const executionPolicySchema: z.ZodObject<{
    Version: z.ZodOptional<z.ZodNumber>;
    version: z.ZodOptional<z.ZodNumber>;
    Mode: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodString>;
    EnforcementMode: z.ZodOptional<z.ZodString>;
    enforcementMode: z.ZodOptional<z.ZodString>;
    AllowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ForbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    forbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    WorkspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    workspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    ExecutionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    executionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    Instruction: z.ZodOptional<z.ZodString>;
    instruction: z.ZodOptional<z.ZodString>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    Version: z.ZodOptional<z.ZodNumber>;
    version: z.ZodOptional<z.ZodNumber>;
    Mode: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodString>;
    EnforcementMode: z.ZodOptional<z.ZodString>;
    enforcementMode: z.ZodOptional<z.ZodString>;
    AllowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ForbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    forbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    WorkspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    workspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    ExecutionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    executionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    Instruction: z.ZodOptional<z.ZodString>;
    instruction: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    Version: z.ZodOptional<z.ZodNumber>;
    version: z.ZodOptional<z.ZodNumber>;
    Mode: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodString>;
    EnforcementMode: z.ZodOptional<z.ZodString>;
    enforcementMode: z.ZodOptional<z.ZodString>;
    AllowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allowedCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    ForbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    forbiddenCapabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    WorkspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    workspaceWriteAllowed: z.ZodOptional<z.ZodBoolean>;
    ExecutionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    executionEvidenceRequired: z.ZodOptional<z.ZodBoolean>;
    Instruction: z.ZodOptional<z.ZodString>;
    instruction: z.ZodOptional<z.ZodString>;
}, z.ZodTypeAny, "passthrough">>;
export declare const executionEvidenceSchema: z.ZodEffects<z.ZodObject<{
    performedCapabilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    workspaceChanged: z.ZodBoolean;
    changedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    enforcementLevel: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    performedCapabilities: string[];
    workspaceChanged: boolean;
    changedFiles: string[];
    enforcementLevel?: string | undefined;
}, {
    workspaceChanged: boolean;
    performedCapabilities?: string[] | undefined;
    changedFiles?: string[] | undefined;
    enforcementLevel?: string | undefined;
}>, {
    performedCapabilities: string[];
    workspaceChanged: boolean;
    changedFiles: string[];
    enforcementLevel?: string | undefined;
}, {
    workspaceChanged: boolean;
    performedCapabilities?: string[] | undefined;
    changedFiles?: string[] | undefined;
    enforcementLevel?: string | undefined;
}>;
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