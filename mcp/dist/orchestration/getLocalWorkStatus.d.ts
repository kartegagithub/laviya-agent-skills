import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const getLocalWorkStatusInputSchema: z.ZodObject<{
    runId: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    runId: number;
}, {
    runId: number;
}>;
export type GetLocalWorkStatusInput = z.infer<typeof getLocalWorkStatusInputSchema>;
export declare function getLocalWorkStatus(client: LaviyaApiClient, logger: Logger, input: GetLocalWorkStatusInput): Promise<unknown>;
//# sourceMappingURL=getLocalWorkStatus.d.ts.map