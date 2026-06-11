export declare class LaviyaApiError extends Error {
    readonly status?: number | undefined;
    readonly body?: unknown | undefined;
    readonly retryAfterMs?: number | undefined;
    constructor(message: string, status?: number | undefined, body?: unknown | undefined, retryAfterMs?: number | undefined);
}
export declare class LaviyaBusinessError extends Error {
    readonly codes: string[];
    readonly envelope?: Record<string, unknown> | undefined;
    constructor(message: string, codes?: string[], envelope?: Record<string, unknown> | undefined);
}
export declare class LaviyaProtocolError extends Error {
    readonly body?: unknown | undefined;
    constructor(message: string, body?: unknown | undefined);
}
//# sourceMappingURL=errors.d.ts.map