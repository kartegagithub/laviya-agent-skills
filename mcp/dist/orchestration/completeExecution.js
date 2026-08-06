import { z } from "zod";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
import { ResultAdapterRegistry } from "../adapters/resultAdapterRegistry.js";
export const completeExecutionPayloadSchema = z.object({
    taskID: z.number().int().positive(),
    aiAgentFlowRunID: z.number().int().positive(),
    aiAgentTaskExecutionID: z.number().int().positive(),
    requestKey: z.string().trim().min(1).max(120).optional(),
    finalOutput: z.string().min(1).max(10 * 1024 * 1024),
    agentType: z.string().trim().min(1).max(100).optional(),
    agentVersion: z.string().trim().min(1).max(100).optional()
}).strict();
export function prepareCompletion(payload) {
    const parsed = completeExecutionPayloadSchema.parse(payload);
    try {
        const canonicalization = new ResultAdapterRegistry().canonicalize(parsed.finalOutput, {
            agentType: parsed.agentType,
            agentVersion: parsed.agentVersion
        });
        return { payload: parsed, canonicalization };
    }
    catch (error) {
        return {
            payload: parsed,
            processingError: error instanceof Error ? error.message : String(error)
        };
    }
}
export async function completeExecution(client, _runtimeConfig, logger, payload, prepared) {
    const completion = prepared ?? prepareCompletion(payload);
    const requestPayloadWithoutKey = {
        taskID: completion.payload.taskID,
        aiAgentFlowRunID: completion.payload.aiAgentFlowRunID,
        aiAgentTaskExecutionID: completion.payload.aiAgentTaskExecutionID,
        rawOutput: completion.payload.finalOutput,
        canonicalResult: completion.canonicalization?.canonicalResult,
        adapterName: completion.canonicalization?.adapterName,
        adapterVersion: completion.canonicalization?.adapterVersion,
        repairs: completion.canonicalization?.repairs,
        processingError: completion.processingError,
        agentType: completion.payload.agentType,
        agentVersion: completion.payload.agentVersion
    };
    const requestKey = completion.payload.requestKey ??
        generateCanonicalRequestKey("CompleteExecution", requestPayloadWithoutKey);
    const requestPayload = { ...requestPayloadWithoutKey, requestKey };
    logger.info("Completing execution with canonical result", {
        taskID: completion.payload.taskID,
        runID: completion.payload.aiAgentFlowRunID,
        executionID: completion.payload.aiAgentTaskExecutionID,
        requestKey,
        outputType: completion.canonicalization?.canonicalResult.outputType,
        agentReportedStatus: completion.canonicalization?.canonicalResult.agentReportedStatus,
        adapterName: completion.canonicalization?.adapterName,
        repairCount: completion.canonicalization?.repairs.length ?? 0,
        processingError: completion.processingError
    });
    return client.completeExecution(requestPayload, requestKey);
}
//# sourceMappingURL=completeExecution.js.map