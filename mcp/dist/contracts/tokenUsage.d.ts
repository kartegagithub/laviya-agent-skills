import { z } from "zod";
export declare const tokenUsageSchema: z.ZodEffects<z.ZodObject<{
    model: z.ZodOptional<z.ZodString>;
    inputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    providerRequestID: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    model?: string | undefined;
    inputTokens?: number | undefined;
    outputTokens?: number | undefined;
    totalTokens?: number | undefined;
    cost?: number | undefined;
    currency?: string | undefined;
    providerRequestID?: string | undefined;
}, {
    model?: string | undefined;
    inputTokens?: number | undefined;
    outputTokens?: number | undefined;
    totalTokens?: number | undefined;
    cost?: number | undefined;
    currency?: string | undefined;
    providerRequestID?: string | undefined;
}>, {
    model?: string | undefined;
    inputTokens?: number | undefined;
    outputTokens?: number | undefined;
    totalTokens?: number | undefined;
    cost?: number | undefined;
    currency?: string | undefined;
    providerRequestID?: string | undefined;
}, {
    model?: string | undefined;
    inputTokens?: number | undefined;
    outputTokens?: number | undefined;
    totalTokens?: number | undefined;
    cost?: number | undefined;
    currency?: string | undefined;
    providerRequestID?: string | undefined;
}>;
//# sourceMappingURL=tokenUsage.d.ts.map