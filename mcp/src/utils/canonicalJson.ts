import { createHash } from "node:crypto";

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function generateCanonicalRequestKey(
  operation: string,
  payload: unknown,
  contractVersion = "v1"
): string {
  const hash = createHash("sha256")
    .update(`${operation}|${contractVersion}|${canonicalJson(payload)}`)
    .digest("hex")
    .slice(0, 32);
  return `lvy-${hash}`;
}

function normalize(value: unknown): unknown {
  if (value === undefined) {
    return null;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Canonical JSON does not support non-finite numbers.");
    }
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      if (record[key] !== undefined) {
        normalized[key] = normalize(record[key]);
      }
    }
    return normalized;
  }
  throw new Error(`Canonical JSON does not support ${typeof value} values.`);
}
