import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
export declare const getMyWorkInputSchema: z.ZodObject<{
    runId: z.ZodOptional<z.ZodNumber>;
    projectId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    projectId?: number | undefined;
    runId?: number | undefined;
}, {
    projectId?: number | undefined;
    runId?: number | undefined;
}>;
export type GetMyWorkInput = z.infer<typeof getMyWorkInputSchema>;
export declare function getMyWork(client: LaviyaApiClient, runtimeConfig: RuntimeConfig, logger: Logger, input: GetMyWorkInput): Promise<unknown>;
//# sourceMappingURL=getMyWork.d.ts.map