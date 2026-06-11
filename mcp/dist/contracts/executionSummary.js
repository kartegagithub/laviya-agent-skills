import { z } from "zod";
export const executionSummarySchema = z
    .object({
    stepRole: z.string().min(1).max(200),
    task: z
        .object({
        taskId: z.number().int().positive(),
        runId: z.number().int().positive(),
        stepIndex: z.number().int().min(0)
    })
        .strict(),
    outcome: z.enum(["success", "failed"]),
    deliverables: z.array(z.string().max(2_000)).max(100),
    keyDecisions: z.array(z.string().max(2_000)).max(100),
    assumptions: z.array(z.string().max(2_000)).max(100),
    risks: z.array(z.string().max(2_000)).max(100),
    policyCompliance: z
        .object({
        mode: z.string().min(1).max(100),
        compliant: z.boolean(),
        workspaceChanged: z.boolean(),
        performedCapabilities: z.array(z.string().min(1).max(200)).max(100),
        notes: z.array(z.string().max(2_000)).max(100)
    })
        .strict()
        .optional(),
    handoff: z
        .object({
        forNextStep: z.string().max(10_000),
        questions: z.array(z.string().max(2_000)).max(100),
        artifacts: z.array(z.string().max(2_000)).max(100)
    })
        .strict()
})
    .strict();
export function parseStructuredExecutionSummary(value) {
    if (value !== undefined) {
        return executionSummarySchema.parse(value);
    }
    return undefined;
}
export function parseExecutionSummaryText(value) {
    if (!value) {
        return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) {
        return undefined;
    }
    let parsed;
    try {
        parsed = JSON.parse(trimmed);
    }
    catch {
        throw new Error("executionSummary appears to be JSON but could not be parsed.");
    }
    return executionSummarySchema.parse(parsed);
}
//# sourceMappingURL=executionSummary.js.map