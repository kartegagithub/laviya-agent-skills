import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface CreateTestCasesToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerCreateTestCasesTool(deps: CreateTestCasesToolDeps): void;
//# sourceMappingURL=createTestCasesTool.d.ts.map