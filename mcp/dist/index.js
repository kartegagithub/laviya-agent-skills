#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRuntimeServer } from "./server.js";
async function main() {
    const runtime = await createRuntimeServer();
    const transport = new StdioServerTransport();
    runtime.logger.info("Starting MCP stdio transport");
    await runtime.server.connect(transport);
    runtime.logger.info("MCP server connected");
    process.on("SIGINT", () => {
        runtime.shutdown();
        process.exit(0);
    });
    process.on("SIGTERM", () => {
        runtime.shutdown();
        process.exit(0);
    });
}
main().catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(message);
    process.exit(1);
});
//# sourceMappingURL=index.js.map