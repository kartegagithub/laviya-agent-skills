import { z } from "zod";
import { executionEvidenceSchema } from "./executionPolicy.js";
export const CONTRACT_VERSION = "1.0";
export const outputTypeValues = [
    "analysis_document",
    "implementation_result",
    "code_review_result",
    "test_result",
    "task_breakdown"
];
export const agentReportedStatusSchema = z.enum(["completed", "failed"]);
const attachmentSchema = z.object({
    name: z.string().trim().min(1).max(255),
    uri: z.string().trim().min(1).max(2_048),
    mediaType: z.string().trim().min(1).max(255).optional()
}).strict();
const sectionSchema = z.object({
    title: z.string().trim().min(1).max(255),
    content: z.string().trim().min(1).max(200_000)
}).strict();
const analysisDocumentPayloadSchema = z.object({
    title: z.string().trim().min(1).max(255),
    summary: z.string().trim().min(1).max(4_000),
    sections: z.array(sectionSchema).min(1).max(100)
}).strict();
const changedFileSchema = z.object({
    path: z.string().trim().min(1).max(2_048),
    change: z.string().trim().min(1).max(4_000)
}).strict();
const implementationResultPayloadSchema = z.object({
    summary: z.string().trim().min(1).max(4_000),
    changedFiles: z.array(changedFileSchema).max(1_000),
    tests: z.object({
        executed: z.boolean(),
        passed: z.boolean().nullable(),
        details: z.string().trim().max(20_000).optional()
    }).strict(),
    remainingIssues: z.array(z.string().trim().min(1).max(4_000)).max(100)
}).strict().superRefine((value, ctx) => {
    if (!value.tests.executed && value.tests.passed !== null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tests", "passed"],
            message: "tests.passed must be null when tests were not executed."
        });
    }
});
const reviewFindingSchema = z.object({
    severity: z.enum(["critical", "high", "medium", "low"]),
    file: z.string().trim().min(1).max(2_048).optional(),
    issue: z.string().trim().min(1).max(20_000),
    recommendation: z.string().trim().min(1).max(20_000)
}).strict();
const codeReviewResultPayloadSchema = z.object({
    decision: z.enum(["approved", "changes_required"]),
    summary: z.string().trim().min(1).max(4_000),
    findings: z.array(reviewFindingSchema).max(500)
}).strict().superRefine((value, ctx) => {
    if (value.decision === "approved" && value.findings.some((finding) => finding.severity === "critical" || finding.severity === "high")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["decision"],
            message: "An approved review cannot contain critical or high findings."
        });
    }
});
const testResultPayloadSchema = z.object({
    summary: z.string().trim().min(1).max(4_000),
    executed: z.number().int().min(0),
    passed: z.number().int().min(0),
    failed: z.number().int().min(0),
    skipped: z.number().int().min(0),
    details: z.string().trim().max(100_000).optional(),
    criticalFailures: z.array(z.string().trim().min(1).max(20_000)).max(100)
}).strict().superRefine((value, ctx) => {
    if (value.passed + value.failed + value.skipped !== value.executed) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["executed"],
            message: "passed + failed + skipped must equal executed."
        });
    }
});
const taskBreakdownItemSchema = z.lazy(() => z.object({
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(20_000).optional(),
    complexity: z.number().int().min(0).max(3).optional(),
    priority: z.number().int().min(0).max(3).optional(),
    estimatedEffort: z.number().min(0).max(100_000).optional(),
    children: z.array(taskBreakdownItemSchema).max(50).optional()
}).strict());
const taskBreakdownPayloadSchema = z.object({
    summary: z.string().trim().min(1).max(4_000),
    tasks: z.array(taskBreakdownItemSchema).min(1).max(100)
}).strict();
const envelopeFields = {
    contractVersion: z.literal(CONTRACT_VERSION),
    agentReportedStatus: agentReportedStatusSchema,
    attachments: z.array(attachmentSchema).max(100).default([]),
    agentNotes: z.array(z.string().trim().min(1).max(4_000)).max(100).default([]),
    executionEvidence: executionEvidenceSchema.optional()
};
export const canonicalResultSchema = z.discriminatedUnion("outputType", [
    z.object({ ...envelopeFields, outputType: z.literal("analysis_document"), payload: analysisDocumentPayloadSchema }).strict(),
    z.object({ ...envelopeFields, outputType: z.literal("implementation_result"), payload: implementationResultPayloadSchema }).strict(),
    z.object({ ...envelopeFields, outputType: z.literal("code_review_result"), payload: codeReviewResultPayloadSchema }).strict(),
    z.object({ ...envelopeFields, outputType: z.literal("test_result"), payload: testResultPayloadSchema }).strict(),
    z.object({ ...envelopeFields, outputType: z.literal("task_breakdown"), payload: taskBreakdownPayloadSchema }).strict()
]);
//# sourceMappingURL=canonicalResult.js.map