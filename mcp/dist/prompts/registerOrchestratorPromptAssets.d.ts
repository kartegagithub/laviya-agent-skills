import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { Logger } from "../utils/logger.js";
export interface RegisterOrchestratorPromptAssetsDeps {
    server: McpServer;
    runtimeConfig: RuntimeConfig;
    logger: Logger;
}
export declare function registerOrchestratorPromptAssets(deps: RegisterOrchestratorPromptAssetsDeps): void;
//# sourceMappingURL=registerOrchestratorPromptAssets.d.ts.map