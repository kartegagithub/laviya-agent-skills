import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export interface StartDeliveryRunToolDeps {
    server: McpServer;
    client: LaviyaApiClient;
    logger: Logger;
}
export declare function registerStartDeliveryRunTool(deps: StartDeliveryRunToolDeps): void;
//# sourceMappingURL=startDeliveryRunTool.d.ts.map