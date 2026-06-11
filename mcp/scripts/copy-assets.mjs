import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");

const copies = [
  {
    source: resolve(rootDir, "src", "prompts", "orchestrator.system.md"),
    destination: resolve(rootDir, "dist", "prompts", "orchestrator.system.md")
  }
];

const schemaDir = resolve(rootDir, "src", "schemas");
for (const entry of await readdir(schemaDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".json")) {
    copies.push({
      source: resolve(schemaDir, entry.name),
      destination: resolve(rootDir, "dist", "schemas", entry.name)
    });
  }
}

for (const copySpec of copies) {
  await mkdir(dirname(copySpec.destination), { recursive: true });
  await cp(copySpec.source, copySpec.destination, { force: true });
}
