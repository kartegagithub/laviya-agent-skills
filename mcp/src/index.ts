#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRuntimeServer } from "./server.js";

async function main(): Promise<void> {
  const runtime = await createRuntimeServer();
  const transport = new StdioServerTransport();

  runtime.logger.info("Starting MCP stdio transport");
  await runtime.server.connect(transport);
  runtime.logger.info("MCP server connected");

  let shutdownStarted = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shutdownStarted) {
      return;
    }
    shutdownStarted = true;
    runtime.logger.info("Shutdown signal received", { signal });

    const forceExitTimer = setTimeout(() => {
      runtime.logger.error("Forced process exit after shutdown timeout", { signal });
      process.exit(1);
    }, 5_000);
    forceExitTimer.unref();

    try {
      await runtime.shutdown();
      process.exitCode = 0;
    } finally {
      clearTimeout(forceExitTimer);
    }
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
