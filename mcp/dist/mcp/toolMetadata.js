import { z } from "zod";
export const toolResultOutputSchema = {
    result: z.unknown().optional(),
    error: z.unknown().optional()
};
export const readOnlyToolAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
export const mutatingToolAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true
};
export const idempotentMutationAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true
};
export const destructiveMutationAnnotations = {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true
};
//# sourceMappingURL=toolMetadata.js.map