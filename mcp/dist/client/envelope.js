import { LaviyaBusinessError, LaviyaProtocolError } from "./errors.js";
export function parseLaviyaEnvelope(payload, sourcePath) {
    const envelope = asRecord(payload);
    if (!envelope) {
        throw new LaviyaProtocolError(`Invalid Laviya response envelope on ${sourcePath}: expected an object.`, payload);
    }
    const hasFailed = readBoolean(envelope, "HasFailed", "hasFailed");
    if (hasFailed === undefined) {
        throw new LaviyaProtocolError(`Invalid Laviya response envelope on ${sourcePath}: HasFailed is missing or not boolean.`, payload);
    }
    const normalized = {
        ...envelope,
        HasFailed: hasFailed
    };
    if (hasFailed) {
        const messages = normalizeMessages(envelope.Messages ?? envelope.messages);
        const text = messages.map((message) => message.description).filter(Boolean);
        const codes = messages.map((message) => message.code).filter((value) => Boolean(value));
        throw new LaviyaBusinessError(text.length > 0 ? text.join("; ") : `Laviya operation failed on ${sourcePath}.`, codes, normalized);
    }
    return normalized;
}
function normalizeMessages(value) {
    const items = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
    const messages = [];
    for (const item of items) {
        if (typeof item === "string" && item.trim()) {
            messages.push({ description: item.trim() });
            continue;
        }
        const record = asRecord(item);
        if (!record) {
            continue;
        }
        const code = firstString(record.Code, record.code, record.Key, record.key);
        const description = firstString(record.Description, record.description, record.Message, record.message, record.Text, record.text) ?? code;
        if (description) {
            messages.push({ code, description });
        }
    }
    return messages;
}
function readBoolean(record, ...keys) {
    for (const key of keys) {
        if (typeof record[key] === "boolean") {
            return record[key];
        }
    }
    return undefined;
}
function firstString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return undefined;
}
function asRecord(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return undefined;
    }
    return value;
}
//# sourceMappingURL=envelope.js.map