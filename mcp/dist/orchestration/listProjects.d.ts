import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const listProjectsInputSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    search?: string | undefined;
}, {
    search?: string | undefined;
}>;
export type ListProjectsInput = z.infer<typeof listProjectsInputSchema>;
export declare function listProjects(client: LaviyaApiClient, logger: Logger, input: ListProjectsInput): Promise<unknown>;
//# sourceMappingURL=listProjects.d.ts.map