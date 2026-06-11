export class LaviyaApiError extends Error {
    status;
    body;
    retryAfterMs;
    constructor(message, status, body, retryAfterMs) {
        super(message);
        this.status = status;
        this.body = body;
        this.retryAfterMs = retryAfterMs;
        this.name = "LaviyaApiError";
    }
}
export class LaviyaBusinessError extends Error {
    codes;
    envelope;
    constructor(message, codes = [], envelope) {
        super(message);
        this.codes = codes;
        this.envelope = envelope;
        this.name = "LaviyaBusinessError";
    }
}
export class LaviyaProtocolError extends Error {
    body;
    constructor(message, body) {
        super(message);
        this.body = body;
        this.name = "LaviyaProtocolError";
    }
}
//# sourceMappingURL=errors.js.map