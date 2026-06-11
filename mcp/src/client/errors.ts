export class LaviyaApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "LaviyaApiError";
  }
}

export class LaviyaBusinessError extends Error {
  constructor(
    message: string,
    public readonly codes: string[] = [],
    public readonly envelope?: Record<string, unknown>
  ) {
    super(message);
    this.name = "LaviyaBusinessError";
  }
}

export class LaviyaProtocolError extends Error {
  constructor(
    message: string,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "LaviyaProtocolError";
  }
}
