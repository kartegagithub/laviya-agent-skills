import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
export declare const toolResultOutputSchema: {
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodUnknown>;
};
export declare const readOnlyToolAnnotations: ToolAnnotations;
export declare const mutatingToolAnnotations: ToolAnnotations;
export declare const idempotentMutationAnnotations: ToolAnnotations;
export declare const destructiveMutationAnnotations: ToolAnnotations;
//# sourceMappingURL=toolMetadata.d.ts.map