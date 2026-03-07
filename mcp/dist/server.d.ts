import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type RuntimeBootstrapOptions, type RuntimeConfig } from "./config/mergeConfig.js";
import { type Logger } from "./utils/logger.js";
export interface RuntimeServer {
    server: McpServer;
    runtimeConfig: RuntimeConfig;
    logger: Logger;
    shutdown: () => void;
}
export declare function createRuntimeServer(options?: RuntimeBootstrapOptions): Promise<RuntimeServer>;
//# sourceMappingURL=server.d.ts.map