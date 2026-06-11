import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Logger } from "../utils/logger.js";
export interface HelpToolDeps {
    server: McpServer;
    logger: Logger;
}
export declare function registerHelpTool(deps: HelpToolDeps): void;
//# sourceMappingURL=helpTool.d.ts.map