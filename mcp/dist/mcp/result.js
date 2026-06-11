import { LaviyaApiError, LaviyaBusinessError, LaviyaProtocolError } from "../client/errors.js";
export async function executeTool(toolName, logger, operation, options = {}) {
    try {
        return successToolResult(await operation(), options.minify);
    }
    catch (error) {
        logger.error(`${toolName} failed`, errorLogContext(error));
        return errorToolResult(error);
    }
}
export function successToolResult(payload, minify = false) {
    const result = normalizeStructuredValue(payload);
    return {
        content: [{ type: "text", text: serialize(payload, minify) }],
        structuredContent: { result }
    };
}
export function errorToolResult(error) {
    const normalized = normalizeToolError(error);
    return {
        content: [{ type: "text", text: normalized.message }],
        structuredContent: {
            error: normalized
        },
        isError: true
    };
}
function normalizeToolError(error) {
    if (error instanceof LaviyaBusinessError) {
        return {
            type: "business",
            message: error.message,
            codes: error.codes
        };
    }
    if (error instanceof LaviyaProtocolError) {
        return {
            type: "protocol",
            message: error.message
        };
    }
    if (error instanceof LaviyaApiError) {
        return {
            type: "transport",
            message: error.message,
            ...(error.status === undefined ? {} : { status: error.status })
        };
    }
    return {
        type: "runtime",
        message: error instanceof Error ? error.message : String(error)
    };
}
function errorLogContext(error) {
    const normalized = normalizeToolError(error);
    return {
        errorType: normalized.type,
        error: normalized.message,
        ...(normalized.status === undefined ? {} : { status: normalized.status }),
        ...(normalized.codes === undefined ? {} : { codes: normalized.codes })
    };
}
function normalizeStructuredValue(payload) {
    if (payload === undefined) {
        return null;
    }
    try {
        return JSON.parse(JSON.stringify(payload));
    }
    catch {
        return String(payload);
    }
}
function serialize(payload, minify) {
    const serialized = minify ? JSON.stringify(payload) : JSON.stringify(payload, null, 2);
    return serialized ?? "null";
}
//# sourceMappingURL=result.js.map