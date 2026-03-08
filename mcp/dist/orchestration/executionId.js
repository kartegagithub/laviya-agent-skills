function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
function coercePositiveInt(value) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseInt(value, 10);
        if (Number.isInteger(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return undefined;
}
export function extractExecutionId(payload) {
    const direct = coercePositiveInt(payload);
    if (direct) {
        return direct;
    }
    const root = asRecord(payload);
    if (!root) {
        return undefined;
    }
    const fromRoot = coercePositiveInt(root.id) ??
        coercePositiveInt(root.ID) ??
        coercePositiveInt(root.executionId) ??
        coercePositiveInt(root.ExecutionID) ??
        coercePositiveInt(root.aiAgentTaskExecutionID) ??
        coercePositiveInt(root.AIAgentTaskExecutionID);
    if (fromRoot) {
        return fromRoot;
    }
    const envelopeData = asRecord(root.Data) ?? asRecord(root.data);
    if (!envelopeData) {
        return undefined;
    }
    return (coercePositiveInt(envelopeData.id) ??
        coercePositiveInt(envelopeData.ID) ??
        coercePositiveInt(envelopeData.executionId) ??
        coercePositiveInt(envelopeData.ExecutionID) ??
        coercePositiveInt(envelopeData.aiAgentTaskExecutionID) ??
        coercePositiveInt(envelopeData.AIAgentTaskExecutionID));
}
//# sourceMappingURL=executionId.js.map