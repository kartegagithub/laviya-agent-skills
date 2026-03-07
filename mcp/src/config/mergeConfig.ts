import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeEnv, type LogLevel } from "../utils/env.js";
import { loadGlobalConfig, type GlobalConfig } from "./loadGlobalConfig.js";
import { loadProjectConfig, type PollMode, type ProjectConfig } from "./loadProjectConfig.js";

export interface RuntimeConfig {
  apiKey: string;
  baseUrl: string;
  agentUid?: string;
  logLevel: LogLevel;
  requestTimeoutSeconds: number;
  pollIntervalSeconds: number;
  leaseRefreshSeconds: number;
  retry: GlobalConfig["retry"];
  auth: GlobalConfig["auth"];
  cwd: string;
  projectRoot: string;
  projectConfig?: ProjectConfig;
  projectConfigPath?: string;
  globalConfigPath?: string;
  pollMode: PollMode;
  runPinning: {
    enabled: boolean;
    runId?: number;
  };
  completion: {
    requireExecutionSummary: boolean;
    autoFailOnMissingSummary: boolean;
    includeLogs: boolean;
    includeTokenUsage: boolean;
  };
  prompt: {
    basePath: string;
    overridePath?: string;
    content: string;
  };
}

export interface RuntimeBootstrapOptions {
  cwd?: string;
  globalConfigPath?: string;
}

export async function buildRuntimeConfig(options: RuntimeBootstrapOptions = {}): Promise<RuntimeConfig> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const env = loadRuntimeEnv();
  const globalLoaded = await loadGlobalConfig(options.globalConfigPath);
  const projectLoaded = await loadProjectConfig(cwd);

  const basePromptPath = fileURLToPath(new URL("../prompts/orchestrator.system.md", import.meta.url));
  const overridePath = resolveOverridePath(projectLoaded.projectRoot, projectLoaded.config?.promptOverridePath);

  const basePrompt = await readFile(basePromptPath, "utf8");
  const overridePrompt = overridePath ? await readFile(overridePath, "utf8") : undefined;

  const completionDefaults = {
    requireExecutionSummary: true,
    autoFailOnMissingSummary: true,
    includeLogs: true,
    includeTokenUsage: false
  };

  return {
    apiKey: env.apiKey,
    baseUrl: env.baseUrl ?? globalLoaded.config.baseUrl,
    agentUid: env.agentUid,
    logLevel: env.logLevel ?? globalLoaded.config.logLevel,
    requestTimeoutSeconds: globalLoaded.config.requestTimeoutSeconds,
    pollIntervalSeconds: globalLoaded.config.defaultPollIntervalSeconds,
    leaseRefreshSeconds: globalLoaded.config.defaultLeaseRefreshSeconds,
    retry: globalLoaded.config.retry,
    auth: globalLoaded.config.auth,
    cwd,
    projectRoot: projectLoaded.projectRoot,
    projectConfig: projectLoaded.config,
    projectConfigPath: projectLoaded.path,
    globalConfigPath: globalLoaded.path,
    pollMode: projectLoaded.config?.pollMode ?? "pull",
    runPinning: {
      enabled: projectLoaded.config?.runPinning?.enabled ?? false,
      runId: projectLoaded.config?.runPinning?.runId
    },
    completion: {
      ...completionDefaults,
      ...projectLoaded.config?.completion
    },
    prompt: {
      basePath: basePromptPath,
      overridePath,
      content: overridePrompt
        ? `${basePrompt}\n\n## Project Override\n${overridePrompt}`
        : basePrompt
    }
  };
}

function resolveOverridePath(projectRoot: string, configuredPath?: string): string | undefined {
  if (!configuredPath) {
    return undefined;
  }

  if (isAbsolute(configuredPath)) {
    return configuredPath;
  }

  return resolve(projectRoot, configuredPath);
}
