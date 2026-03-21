import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRootUrl = new URL("./", import.meta.url);

export const packageRoot = path.normalize(fileURLToPath(packageRootUrl));

export const assetRelativePaths = Object.freeze({
  orchestratorSystemPrompt: "core/orchestrator.system.md",
  executionSummarySchema: "core/execution-summary.schema.json",
  completeExecutionPayloadExample: "core/complete-execution.payload.example.json",
  claudeSkill: "claude/SKILL.md",
  cursorRule: "cursor/.cursor/rules/laviya-orchestrator.mdc",
  setupGuide: "docs/Setup.md",
  installationGuide: "docs/InstallationAndUsage.md",
  mcpPublishGuide: "docs/MCPServerPublish.md"
});

function normalizeRelativePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.trim().length === 0) {
    throw new TypeError("relativePath must be a non-empty string.");
  }

  const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");

  if (normalized === ".." || normalized.startsWith("../")) {
    throw new Error("relativePath must stay within the package root.");
  }

  return normalized;
}

export function resolvePackagePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  return path.normalize(fileURLToPath(new URL(normalized, packageRootUrl)));
}

export const assets = Object.freeze(
  Object.fromEntries(
    Object.entries(assetRelativePaths).map(([assetKey, relativePath]) => [
      assetKey,
      resolvePackagePath(relativePath)
    ])
  )
);

export function resolveAssetPath(assetKey) {
  if (!(assetKey in assetRelativePaths)) {
    throw new Error(`Unknown asset key: ${assetKey}`);
  }

  return assets[assetKey];
}

export function listAssetPaths() {
  return { ...assets };
}
