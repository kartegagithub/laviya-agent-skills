import { z } from "zod";
import { parseExecutionSummaryText, parseStructuredExecutionSummary } from "../contracts/executionSummary.js";
import { tokenUsageSchema } from "../contracts/tokenUsage.js";
import { executionEvidenceSchema } from "../contracts/executionPolicy.js";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
const taskTypeValues = [0, 10, 20, 30, 40, 50, 60, 70, 80];
const actionInputSchema = z.object({
    actionType: z.string().min(1).optional(),
    actionDetails: z.string().optional(),
    message: z.string().optional(),
    level: z.string().min(1).optional(),
    duration: z.number().int().min(0).optional()
}).strict();
const generatedTaskInputSchema = z.lazy(() => z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    complexity: z.number().int().min(0).max(3),
    priority: z.number().int().min(0).max(3),
    taskTypeID: z
        .number()
        .int()
        .refine((value) => taskTypeValues.includes(value), "Invalid taskTypeID"),
    estimatedEffort: z.number().min(0),
    referenceID: z.string().min(1).optional(),
    subTasks: z.array(generatedTaskInputSchema).max(50).optional()
}).strict());
const generatedWikiInputSchema = z.lazy(() => z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    subWikis: z.array(generatedWikiInputSchema).max(50).optional(),
    relatedTaskReferenceIDs: z.array(z.string().min(1)).max(100).optional()
}).strict());
function normalizeReferenceID(referenceID) {
    return referenceID.trim().toLowerCase();
}
function collectTaskReferenceIDs(items) {
    if (!items || items.length === 0) {
        return [];
    }
    const references = [];
    const stack = [...items];
    while (stack.length > 0) {
        const item = stack.pop();
        if (!item) {
            continue;
        }
        if (item.referenceID && item.referenceID.trim()) {
            references.push(item.referenceID.trim());
        }
        if (item.subTasks && item.subTasks.length > 0) {
            stack.push(...item.subTasks);
        }
    }
    return references;
}
function collectWikiReferenceIDs(items) {
    if (!items || items.length === 0) {
        return [];
    }
    const references = [];
    const stack = [...items];
    while (stack.length > 0) {
        const item = stack.pop();
        if (!item) {
            continue;
        }
        if (item.relatedTaskReferenceIDs && item.relatedTaskReferenceIDs.length > 0) {
            for (const reference of item.relatedTaskReferenceIDs) {
                if (reference && reference.trim()) {
                    references.push(reference.trim());
                }
            }
        }
        if (item.subWikis && item.subWikis.length > 0) {
            stack.push(...item.subWikis);
        }
    }
    return references;
}
export const completeExecutionPayloadSchema = z
    .object({
    taskID: z.number().int().positive(),
    aiAgentFlowRunID: z.number().int().positive(),
    aiAgentTaskExecutionID: z.number().int().positive().optional(),
    requestKey: z.string().min(1).optional(),
    executionSummary: z.string().min(1).optional(),
    executionSummaryObject: z.unknown().optional(),
    errorMessage: z.string().optional().nullable(),
    isFailed: z.boolean(),
    logs: z.array(actionInputSchema).max(1_000).optional(),
    tokenUsages: z.array(tokenUsageSchema).max(100).optional(),
    tasks: z.array(generatedTaskInputSchema).max(100).optional(),
    wikis: z.array(generatedWikiInputSchema).max(100).optional(),
    lessons: z.array(generatedWikiInputSchema).max(100).optional(),
    technicalAnalysis: generatedWikiInputSchema.optional(),
    executionEvidence: executionEvidenceSchema.optional()
})
    .strict()
    .superRefine((payload, ctx) => {
    const hasExecutionSummaryText = typeof payload.executionSummary === "string" && payload.executionSummary.trim().length > 0;
    const hasExecutionSummaryObject = payload.executionSummaryObject !== undefined;
    if (!hasExecutionSummaryText && !hasExecutionSummaryObject) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["executionSummary"],
            message: "Provide executionSummary text or executionSummaryObject."
        });
    }
    validateTreeDepth(payload.tasks, "subTasks", ["tasks"], ctx);
    validateTreeDepth(payload.wikis, "subWikis", ["wikis"], ctx);
    validateTreeDepth(payload.lessons, "subWikis", ["lessons"], ctx);
    validateTreeDepth(payload.technicalAnalysis ? [payload.technicalAnalysis] : undefined, "subWikis", ["technicalAnalysis"], ctx);
    const taskReferenceIDs = collectTaskReferenceIDs(payload.tasks);
    const normalizedTaskReferences = new Set();
    for (const referenceID of taskReferenceIDs) {
        const normalizedReference = normalizeReferenceID(referenceID);
        if (normalizedTaskReferences.has(normalizedReference)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["tasks"],
                message: `Duplicate tasks.referenceID detected (case-insensitive): ${referenceID}`
            });
        }
        else {
            normalizedTaskReferences.add(normalizedReference);
        }
    }
    const wikiReferenceIDs = [
        ...collectWikiReferenceIDs(payload.wikis),
        ...collectWikiReferenceIDs(payload.lessons),
        ...collectWikiReferenceIDs(payload.technicalAnalysis ? [payload.technicalAnalysis] : undefined)
    ];
    if (wikiReferenceIDs.length === 0) {
        return;
    }
    if (normalizedTaskReferences.size === 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["wikis"],
            message: "wikis/lessons.relatedTaskReferenceIDs requires tasks.referenceID values in the same payload. Remove relatedTaskReferenceIDs or provide matching tasks."
        });
        return;
    }
    const missingReferences = Array.from(new Set(wikiReferenceIDs
        .filter((referenceID) => !normalizedTaskReferences.has(normalizeReferenceID(referenceID)))
        .map((referenceID) => referenceID.trim())));
    if (missingReferences.length > 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["wikis"],
            message: `wikis/lessons.relatedTaskReferenceIDs contains values not found in tasks.referenceID (same payload required): ${missingReferences.join(", ")}`
        });
    }
});
export async function completeExecution(client, runtimeConfig, logger, payload) {
    const structuredSummary = parseStructuredExecutionSummary(payload.executionSummaryObject) ??
        parseExecutionSummaryText(payload.executionSummary);
    if (structuredSummary) {
        validateSummaryConsistency(structuredSummary, payload);
        validatePolicySummaryConsistency(structuredSummary, payload);
    }
    const executionSummary = resolveExecutionSummary(payload);
    if (runtimeConfig.completion.requireExecutionSummary && !executionSummary.trim()) {
        throw new Error("executionSummary is required by runtime configuration.");
    }
    if (!payload.aiAgentTaskExecutionID) {
        logger.warn("CompleteExecution called without aiAgentTaskExecutionID. This may attach completion to an unexpected execution.", {
            taskID: payload.taskID,
            runID: payload.aiAgentFlowRunID
        });
    }
    const { executionSummaryObject: _executionSummaryObject, requestKey: suppliedRequestKey, ...restPayload } = payload;
    const payloadWithoutRequestKey = {
        ...restPayload,
        executionSummary,
        logs: runtimeConfig.completion.includeLogs ? payload.logs : undefined,
        tokenUsages: runtimeConfig.completion.includeTokenUsage ? payload.tokenUsages : undefined
    };
    const requestKey = suppliedRequestKey ??
        generateCanonicalRequestKey("CompleteExecution", payloadWithoutRequestKey);
    const normalizedPayload = {
        ...payloadWithoutRequestKey,
        requestKey
    };
    logger.info("Completing execution", {
        taskID: payload.taskID,
        runID: payload.aiAgentFlowRunID,
        executionID: payload.aiAgentTaskExecutionID,
        requestKey,
        isFailed: payload.isFailed
    });
    return client.completeExecution(normalizedPayload, requestKey);
}
function validatePolicySummaryConsistency(summary, payload) {
    if (!summary.policyCompliance || !payload.executionEvidence) {
        return;
    }
    if (!summary.policyCompliance.compliant) {
        throw new Error("Execution summary policyCompliance.compliant must be true for successful policy validation.");
    }
    if (summary.policyCompliance.workspaceChanged !==
        payload.executionEvidence.workspaceChanged) {
        throw new Error("Execution summary policyCompliance.workspaceChanged must match executionEvidence.");
    }
    const summaryCapabilities = [...summary.policyCompliance.performedCapabilities].sort();
    const evidenceCapabilities = [...payload.executionEvidence.performedCapabilities].sort();
    if (JSON.stringify(summaryCapabilities) !== JSON.stringify(evidenceCapabilities)) {
        throw new Error("Execution summary policyCompliance.performedCapabilities must match executionEvidence.");
    }
}
function validateSummaryConsistency(summary, payload) {
    if (summary.task.taskId !== payload.taskID || summary.task.runId !== payload.aiAgentFlowRunID) {
        throw new Error("Execution summary task identifiers must match the completion payload.");
    }
    const expectedOutcome = payload.isFailed ? "failed" : "success";
    if (summary.outcome !== expectedOutcome) {
        throw new Error(`Execution summary outcome must be "${expectedOutcome}" for this completion.`);
    }
}
function resolveExecutionSummary(payload) {
    if (typeof payload.executionSummary === "string" && payload.executionSummary.trim().length > 0) {
        return payload.executionSummary;
    }
    if (payload.executionSummaryObject === undefined) {
        return "";
    }
    try {
        return JSON.stringify(payload.executionSummaryObject);
    }
    catch {
        throw new Error("executionSummaryObject must be JSON-serializable.");
    }
}
function validateTreeDepth(items, childKey, path, ctx, depth = 1) {
    if (!items) {
        return;
    }
    if (depth > 10) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: "Nested generated content cannot exceed 10 levels."
        });
        return;
    }
    for (const [index, item] of items.entries()) {
        const children = item[childKey];
        if (Array.isArray(children)) {
            validateTreeDepth(children, childKey, [...path, index, childKey], ctx, depth + 1);
        }
    }
}
//# sourceMappingURL=completeExecution.js.map