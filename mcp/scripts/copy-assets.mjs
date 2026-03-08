import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, "..");

const copies = [
  { source: resolve(rootDir, "src", "prompts"), destination: resolve(rootDir, "dist", "prompts") },
  { source: resolve(rootDir, "src", "schemas"), destination: resolve(rootDir, "dist", "schemas") }
];

for (const copySpec of copies) {
  await mkdir(dirname(copySpec.destination), { recursive: true });
  await cp(copySpec.source, copySpec.destination, { recursive: true, force: true });
}
