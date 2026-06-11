import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RuntimeConfig } from "../config/mergeConfig.js";
import type { LeaseManager } from "../orchestration/leaseManager.js";
import type { Logger } from "../utils/logger.js";
export interface DiagnosticsToolDeps {
    server: McpServer;
    runtimeConfig: RuntimeConfig;
    leaseManager: LeaseManager;
    logger: Logger;
    serverVersion: string;
}
export declare function registerDiagnosticsTool(deps: DiagnosticsToolDeps): void;
//# sourceMappingURL=diagnosticsTool.d.ts.map