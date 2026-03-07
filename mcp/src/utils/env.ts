import { z } from "zod";

export const logLevels = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof logLevels)[number];

const envSchema = z.object({
  LAVIYA_API_KEY: z.string().min(1, "LAVIYA_API_KEY is required"),
  LAVIYA_BASE_URL: z.string().url().optional(),
  LAVIYA_AGENT_UID: z.string().min(1).optional(),
  LAVIYA_LOG_LEVEL: z.enum(logLevels).optional()
});

export interface RuntimeEnv {
  apiKey: string;
  baseUrl?: string;
  agentUid?: string;
  logLevel?: LogLevel;
}

export function loadRuntimeEnv(env: NodeJS.ProcessEnv = process.env): RuntimeEnv {
  const parsed = envSchema.safeParse({
    LAVIYA_API_KEY: env.LAVIYA_API_KEY,
    LAVIYA_BASE_URL: env.LAVIYA_BASE_URL,
    LAVIYA_AGENT_UID: env.LAVIYA_AGENT_UID,
    LAVIYA_LOG_LEVEL: env.LAVIYA_LOG_LEVEL
  });

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Invalid environment configuration: ${errors}`);
  }

  return {
    apiKey: parsed.data.LAVIYA_API_KEY,
    baseUrl: parsed.data.LAVIYA_BASE_URL,
    agentUid: parsed.data.LAVIYA_AGENT_UID,
    logLevel: parsed.data.LAVIYA_LOG_LEVEL
  };
}
