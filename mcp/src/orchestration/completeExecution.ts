import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
import { generateDeterministicRequestKey } from "../utils/requestKey.js";

const taskTypeValues = [0, 10, 20, 30, 40, 50, 60, 70, 80] as const;

const actionInputSchema = z.object({
  actionType: z.string().min(1).optional(),
  actionDetails: z.string().optional(),
  message: z.string().optional(),
  level: z.string().min(1).optional(),
  duration: z.number().int().min(0).optional()
}).passthrough();

const tokenUsageInputSchema = z.object({
  model: z.string().min(1).optional(),
  inputTokens: z.number().int().min(0).optional(),
  outputTokens: z.number().int().min(0).optional(),
  totalTokens: z.number().int().min(0).optional(),
  cost: z.number().min(0).optional(),
  currency: z.string().min(1).optional(),
  providerRequestID: z.string().optional()
}).passthrough();

type GeneratedTaskInput = {
  title: string;
  description?: string;
  complexity: number;
  priority: number;
  taskTypeID: number;
  estimatedEffort: number;
  referenceID?: string;
  subTasks?: GeneratedTaskInput[];
};

const generatedTaskInputSchema: z.ZodType<GeneratedTaskInput> = z.lazy(() =>
  z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    complexity: z.number().int().min(0).max(3),
    priority: z.number().int().min(0).max(3),
    taskTypeID: z
      .number()
      .int()
      .refine((value) => taskTypeValues.includes(value as (typeof taskTypeValues)[number]), "Invalid taskTypeID"),
    estimatedEffort: z.number().min(0),
    referenceID: z.string().min(1).optional(),
    subTasks: z.array(generatedTaskInputSchema).optional()
  }).passthrough()
);

type GeneratedWikiInput = {
  name: string;
  description?: string;
  subWikis?: GeneratedWikiInput[];
  relatedTaskReferenceIDs?: string[];
};

const generatedWikiInputSchema: z.ZodType<GeneratedWikiInput> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    subWikis: z.array(generatedWikiInputSchema).optional(),
    relatedTaskReferenceIDs: z.array(z.string().min(1)).optional()
  }).passthrough()
);

function normalizeReferenceID(referenceID: string): string {
  return referenceID.trim().toLowerCase();
}

function collectTaskReferenceIDs(items: GeneratedTaskInput[] | undefined): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  const references: string[] = [];
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

function collectWikiReferenceIDs(items: GeneratedWikiInput[] | undefined): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  const references: string[] = [];
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
    executionSummary: z.string().min(1),
    errorMessage: z.string().optional().nullable(),
    isFailed: z.boolean(),
    logs: z.array(actionInputSchema).optional(),
    tokenUsages: z.array(tokenUsageInputSchema).optional(),
    tasks: z.array(generatedTaskInputSchema).optional(),
    wikis: z.array(generatedWikiInputSchema).optional(),
    technicalAnalysis: generatedWikiInputSchema.optional()
  })
  .passthrough()
  .superRefine((payload, ctx) => {
    const taskReferenceIDs = collectTaskReferenceIDs(payload.tasks);
    const normalizedTaskReferences = new Set<string>();

    for (const referenceID of taskReferenceIDs) {
      const normalizedReference = normalizeReferenceID(referenceID);
      if (normalizedTaskReferences.has(normalizedReference)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tasks"],
          message: `Duplicate tasks.referenceID detected (case-insensitive): ${referenceID}`
        });
      } else {
        normalizedTaskReferences.add(normalizedReference);
      }
    }

    const wikiReferenceIDs = [
      ...collectWikiReferenceIDs(payload.wikis),
      ...collectWikiReferenceIDs(payload.technicalAnalysis ? [payload.technicalAnalysis] : undefined)
    ];

    if (wikiReferenceIDs.length === 0) {
      return;
    }

    if (normalizedTaskReferences.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wikis"],
        message:
          "wikis.relatedTaskReferenceIDs requires tasks.referenceID values in the same payload. Remove relatedTaskReferenceIDs or provide matching tasks."
      });
      return;
    }

    const missingReferences = Array.from(
      new Set(
        wikiReferenceIDs
          .filter((referenceID) => !normalizedTaskReferences.has(normalizeReferenceID(referenceID)))
          .map((referenceID) => referenceID.trim())
      )
    );

    if (missingReferences.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wikis"],
        message: `wikis.relatedTaskReferenceIDs contains values not found in tasks.referenceID (same payload required): ${missingReferences.join(", ")}`
      });
    }
  });

export type CompleteExecutionPayload = z.infer<typeof completeExecutionPayloadSchema>;

export async function completeExecution(
  client: LaviyaApiClient,
  runtimeConfig: RuntimeConfig,
  logger: Logger,
  payload: CompleteExecutionPayload
): Promise<unknown> {
  if (runtimeConfig.completion.requireExecutionSummary && !payload.executionSummary.trim()) {
    throw new Error("executionSummary is required by runtime configuration.");
  }

  if (!payload.aiAgentTaskExecutionID) {
    logger.warn("CompleteExecution called without aiAgentTaskExecutionID. This may attach completion to an unexpected execution.", {
      taskID: payload.taskID,
      runID: payload.aiAgentFlowRunID
    });
  }

  const requestKey =
    payload.requestKey ??
    generateDeterministicRequestKey([
      payload.aiAgentFlowRunID,
      payload.taskID,
      payload.aiAgentTaskExecutionID,
      payload.executionSummary,
      payload.isFailed ? 1 : 0
    ]);

  const normalizedPayload: CompleteExecutionPayload = {
    ...payload,
    requestKey,
    logs: runtimeConfig.completion.includeLogs ? payload.logs : undefined,
    tokenUsages: runtimeConfig.completion.includeTokenUsage ? payload.tokenUsages : undefined
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
