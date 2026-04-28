import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const feedTaskPayloadSchema: z.ZodObject<{
    taskID: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    taskID: number;
}, {
    taskID: number;
}>;
export type FeedTaskPayload = z.infer<typeof feedTaskPayloadSchema>;
export declare function feedTask(client: LaviyaApiClient, logger: Logger, payload: FeedTaskPayload): Promise<unknown>;
//# sourceMappingURL=feedTask.d.ts.map