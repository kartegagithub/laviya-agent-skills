import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const cancelLocalWorkPayloadSchema: z.ZodObject<{
    runID: z.ZodNumber;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    runID: number;
    reason?: string | undefined;
}, {
    runID: number;
    reason?: string | undefined;
}>;
export type CancelLocalWorkPayload = z.infer<typeof cancelLocalWorkPayloadSchema>;
export declare function cancelLocalWork(client: LaviyaApiClient, logger: Logger, payload: CancelLocalWorkPayload): Promise<unknown>;
//# sourceMappingURL=cancelLocalWork.d.ts.map