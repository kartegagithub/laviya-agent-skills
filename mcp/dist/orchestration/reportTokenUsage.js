import { z } from "zod";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
import { tokenUsageSchema } from "../contracts/tokenUsage.js";
export const reportTokenUsagePayloadSchema = z.object({
    taskID: z.number().int().positive(),
    aiAgentFlowRunID: z.number().int().positive(),
    aiAgentTaskExecutionID: z.number().int().positive().optional(),
    tokenUsages: z.array(tokenUsageSchema).min(1),
    requestKey: z.string().min(1).optional()
}).strict();
export async function reportTokenUsage(client, logger, payload) {
    const { requestKey: suppliedRequestKey, ...payloadWithoutRequestKey } = payload;
    const requestKey = suppliedRequestKey ??
        generateCanonicalRequestKey("ReportTokenUsage", payloadWithoutRequestKey);
    const normalizedPayload = {
        ...payloadWithoutRequestKey,
        requestKey
    };
    logger.info("Reporting token usage", {
        runID: payload.aiAgentFlowRunID,
        taskID: payload.taskID,
        count: payload.tokenUsages.length
    });
    return client.reportTokenUsage(normalizedPayload, requestKey);
}
//# sourceMappingURL=reportTokenUsage.js.map