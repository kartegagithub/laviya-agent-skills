import { access, constants, readFile, realpath, stat } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRuntimeEnv } from "../utils/env.js";
import { loadGlobalConfig } from "./loadGlobalConfig.js";
import { loadProjectConfig } from "./loadProjectConfig.js";
export async function buildRuntimeConfig(options = {}) {
    const cwd = resolve(options.cwd ?? process.cwd());
    const env = loadRuntimeEnv();
    const globalLoaded = await loadGlobalConfig(options.globalConfigPath);
    const projectLoaded = await loadProjectConfig(cwd);
    const configWarnings = globalLoaded.warning ? [globalLoaded.warning] : [];
    if (projectLoaded.config?.pollMode === "long-poll") {
        configWarnings.push('pollMode "long-poll" is currently treated as pull mode because polling is controlled by the MCP host.');
    }
    if (projectLoaded.config?.codingRules) {
        configWarnings.push("codingRules paths are accepted for compatibility but are not loaded by the MCP runtime.");
    }
    if (projectLoaded.config?.completion?.autoFailOnMissingSummary !== undefined) {
        configWarnings.push("completion.autoFailOnMissingSummary is deprecated; invalid completion payloads are returned as MCP tool errors.");
    }
    const basePromptPath = await resolveRuntimeAssetPath("../prompts/orchestrator.system.md", "../../src/prompts/orchestrator.system.md");
    const overridePath = await resolvePromptOverridePath(projectLoaded.projectRoot, projectLoaded.config?.promptOverridePath);
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
        },
        configWarnings
    };
}
const MAX_PROMPT_OVERRIDE_BYTES = 256 * 1024;
const ALLOWED_PROMPT_EXTENSIONS = new Set([".md", ".markdown"]);
export async function resolvePromptOverridePath(projectRoot, configuredPath) {
    if (!configuredPath) {
        return undefined;
    }
    const candidatePath = isAbsolute(configuredPath)
        ? resolve(configuredPath)
        : resolve(projectRoot, configuredPath);
    const extension = extname(candidatePath).toLowerCase();
    if (!ALLOWED_PROMPT_EXTENSIONS.has(extension)) {
        throw new Error("promptOverridePath must point to a .md or .markdown file.");
    }
    const [resolvedProjectRoot, resolvedCandidatePath] = await Promise.all([
        realpath(projectRoot),
        realpath(candidatePath)
    ]);
    const relativePath = relative(resolvedProjectRoot, resolvedCandidatePath);
    if (relativePath === ".." || relativePath.startsWith(`..\\`) || relativePath.startsWith("../") || isAbsolute(relativePath)) {
        throw new Error("promptOverridePath must resolve inside the project root.");
    }
    const fileStats = await stat(resolvedCandidatePath);
    if (!fileStats.isFile()) {
        throw new Error("promptOverridePath must point to a regular file.");
    }
    if (fileStats.size > MAX_PROMPT_OVERRIDE_BYTES) {
        throw new Error(`promptOverridePath exceeds the ${MAX_PROMPT_OVERRIDE_BYTES} byte limit.`);
    }
    return resolvedCandidatePath;
}
async function resolveRuntimeAssetPath(primaryRelativePath, fallbackRelativePath) {
    const primaryPath = fileURLToPath(new URL(primaryRelativePath, import.meta.url));
    if (await fileExists(primaryPath)) {
        return primaryPath;
    }
    const fallbackPath = fileURLToPath(new URL(fallbackRelativePath, import.meta.url));
    if (await fileExists(fallbackPath)) {
        return fallbackPath;
    }
    throw new Error(`Runtime asset not found. Tried: ${primaryPath} and ${fallbackPath}`);
}
async function fileExists(path) {
    try {
        await access(path, constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=mergeConfig.js.map