import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const serverJson = JSON.parse(await readFile(resolve(root, "server.json"), "utf8"));
const packageVersion = packageJson.version;
const versions = [
  ["server.json", serverJson.version],
  ["server.json package", serverJson.packages?.[0]?.version]
];

for (const [source, version] of versions) {
  if (version !== packageVersion) {
    throw new Error(`${source} version ${version} does not match package.json ${packageVersion}.`);
  }
}

console.log(`Version manifests match: ${packageVersion}`);
