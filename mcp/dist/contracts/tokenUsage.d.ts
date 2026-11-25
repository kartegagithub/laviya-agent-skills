import { z } from "zod";
export declare const tokenUsageSchema: z.ZodObject<{
    measurement: z.ZodEnum<{
        exact: "exact";
        estimated: "estimated";
        unavailable: "unavailable";
    }>;
    measurementSource: z.ZodOptional<z.ZodString>;
    estimationModelVersion: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    inputTokens: z.ZodOptional<z.ZodNumber>;
    outputTokens: z.ZodOptional<z.ZodNumber>;
    totalTokens: z.ZodOptional<z.ZodNumber>;
    cost: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    providerRequestID: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
//# sourceMappingURL=tokenUsage.d.ts.map