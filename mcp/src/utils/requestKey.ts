import { createHash, randomUUID } from "node:crypto";

export function generateRequestKey(prefix = "lvy"): string {
  return `${prefix}-${randomUUID()}`;
}

export function generateDeterministicRequestKey(parts: Array<string | number | undefined>): string {
  const raw = parts
    .filter((part) => part !== undefined && part !== null && part !== "")
    .map((part) => String(part))
    .join("|");

  const hash = createHash("sha256").update(raw).digest("hex").slice(0, 32);
  return `lvy-${hash}`;
}
