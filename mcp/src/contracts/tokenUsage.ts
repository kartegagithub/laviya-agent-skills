import { z } from "zod";

export const tokenUsageSchema = z
  .object({
    model: z.string().min(1).max(200).optional(),
    inputTokens: z.number().int().min(0).optional(),
    outputTokens: z.number().int().min(0).optional(),
    totalTokens: z.number().int().min(0).optional(),
    cost: z.number().min(0).optional(),
    currency: z.string().min(1).max(20).optional(),
    providerRequestID: z.string().max(500).optional()
  })
  .strict()
  .superRefine((usage, ctx) => {
    const hasMeasurement =
      usage.inputTokens !== undefined ||
      usage.outputTokens !== undefined ||
      usage.totalTokens !== undefined ||
      usage.cost !== undefined;
    if (!hasMeasurement) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Token usage must contain at least one measured token or cost value."
      });
    }

    if (
      usage.totalTokens !== undefined &&
      usage.inputTokens !== undefined &&
      usage.outputTokens !== undefined &&
      usage.totalTokens !== usage.inputTokens + usage.outputTokens
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalTokens"],
        message: "totalTokens must equal inputTokens + outputTokens when all three are provided."
      });
    }

    if (usage.cost !== undefined && !usage.currency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currency"],
        message: "currency is required when cost is provided."
      });
    }
  });
