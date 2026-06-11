const REDACTED = "***";

const SENSITIVE_QUERY_PATTERN = /((?:^|[?&\s])(?:apiKey|api_key)=)([^&#\s]*)/gim;
const AGENT_UID_QUERY_PATTERN = /((?:^|[?&\s])(?:agentUID|agentUid|aiAgentUID|aiAgentUid)=)([^&#\s]*)/gim;

export function redactSensitiveText(value: string): string {
  return value
    .replace(SENSITIVE_QUERY_PATTERN, `$1${REDACTED}`)
    .replace(AGENT_UID_QUERY_PATTERN, (_match, prefix: string, agentUid: string) => {
      return `${prefix}${summarizeIdentifier(decodeSafely(agentUid))}`;
    });
}

export function redactLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item));
  }

  if (!isRecord(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (isApiKeyName(key)) {
      redacted[key] = REDACTED;
      continue;
    }

    if (isAgentUidName(key) && typeof item === "string") {
      redacted[key] = summarizeIdentifier(item);
      continue;
    }

    redacted[key] = redactLogValue(item);
  }

  return redacted;
}

export function redactSecretValue(value: unknown, secret: string): unknown {
  if (!secret) {
    return value;
  }

  if (typeof value === "string") {
    return redactSensitiveText(value.split(secret).join(REDACTED));
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecretValue(item, secret));
  }

  if (!isRecord(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    redacted[key] = isApiKeyName(key) ? REDACTED : redactSecretValue(item, secret);
  }
  return redacted;
}

export function summarizeIdentifier(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
}

function isApiKeyName(key: string): boolean {
  const normalized = key.replace(/[-_]/g, "").toLowerCase();
  return normalized === "apikey";
}

function isAgentUidName(key: string): boolean {
  const normalized = key.replace(/[-_]/g, "").toLowerCase();
  return normalized === "agentuid" || normalized === "aiagentuid";
}

function decodeSafely(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
