import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface ListTestCasesToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerListTestCasesTool(deps: ListTestCasesToolDeps): void;
//# sourceMappingURL=listTestCasesTool.d.ts.map