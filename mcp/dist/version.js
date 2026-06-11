import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const packageJson = require("../package.json");
if (typeof packageJson.version !== "string" || !packageJson.version.trim()) {
    throw new Error("Unable to resolve MCP package version from package.json.");
}
export const SERVER_VERSION = packageJson.version;
//# sourceMappingURL=version.js.map