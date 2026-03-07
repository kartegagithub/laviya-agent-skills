import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeEnv } from "../utils/env.js";
import { loadGlobalConfig } from "./loadGlobalConfig.js";
import { loadProjectConfig } from "./loadProjectConfig.js";
export async function buildRuntimeConfig(options = {}) {
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
function resolveOverridePath(projectRoot, configuredPath) {
    if (!configuredPath) {
        return undefined;
    }
    if (isAbsolute(configuredPath)) {
        return configuredPath;
    }
    return resolve(projectRoot, configuredPath);
}
//# sourceMappingURL=mergeConfig.js.map