import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const repoRoot = resolve(root, "..");
const canonical = await readFile(resolve(repoRoot, "core", "orchestrator.system.md"), "utf8");
const runtimePrompt = await readFile(resolve(root, "src", "prompts", "orchestrator.system.md"), "utf8");

if (canonical !== runtimePrompt) {
  throw new Error(
    "Prompt asset drift detected: core/orchestrator.system.md and mcp/src/prompts/orchestrator.system.md differ."
  );
}

console.log("Canonical orchestrator prompt assets match.");
