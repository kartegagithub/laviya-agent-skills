import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface ListProgressPaymentsToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerListProgressPaymentsTool(deps: ListProgressPaymentsToolDeps): void;
//# sourceMappingURL=listProgressPaymentsTool.d.ts.map