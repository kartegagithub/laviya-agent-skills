import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LaviyaApiClient } from "./client/laviyaApiClient.js";
import { buildRuntimeConfig, type RuntimeBootstrapOptions, type RuntimeConfig } from "./config/mergeConfig.js";
import { LeaseManager } from "./orchestration/leaseManager.js";
import { registerCompleteExecutionTool } from "./tools/completeExecutionTool.js";
import { registerGetMyWorkTool } from "./tools/getMyWorkTool.js";
import { registerReportTokenUsageTool } from "./tools/reportTokenUsageTool.js";
import { registerStartExecutionTool } from "./tools/startExecutionTool.js";
import { createLogger, type Logger } from "./utils/logger.js";

const SERVER_NAME = "laviya-orchestrator-runtime";
const SERVER_VERSION = "0.1.0";

export interface RuntimeServer {
  server: McpServer;
  runtimeConfig: RuntimeConfig;
  logger: Logger;
  shutdown: () => void;
}

export async function createRuntimeServer(options: RuntimeBootstrapOptions = {}): Promise<RuntimeServer> {
  const runtimeConfig = await buildRuntimeConfig(options);
  const logger = createLogger(runtimeConfig.logLevel, {
    service: SERVER_NAME
  });

  logger.info("Runtime configuration loaded", {
    cwd: runtimeConfig.cwd,
    projectRoot: runtimeConfig.projectRoot,
    projectConfigPath: runtimeConfig.projectConfigPath,
    globalConfigPath: runtimeConfig.globalConfigPath,
    pollMode: runtimeConfig.pollMode
  });

  const client = new LaviyaApiClient({
    baseUrl: runtimeConfig.baseUrl,
    apiKey: runtimeConfig.apiKey,
    agentUid: runtimeConfig.agentUid,
    auth: runtimeConfig.auth,
    retry: runtimeConfig.retry,
    requestTimeoutSeconds: runtimeConfig.requestTimeoutSeconds,
    logger: logger.child({ component: "api-client" })
  });

  const leaseManager = new LeaseManager(
    client,
    logger.child({ component: "lease-manager" }),
    runtimeConfig.leaseRefreshSeconds
  );

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION
  });

  registerGetMyWorkTool({
    server,
    client,
    runtimeConfig,
    logger: logger.child({ tool: "laviya_get_my_work" })
  });

  registerStartExecutionTool({
    server,
    client,
    leaseManager,
    logger: logger.child({ tool: "laviya_start_execution" })
  });

  registerCompleteExecutionTool({
    server,
    client,
    runtimeConfig,
    leaseManager,
    logger: logger.child({ tool: "laviya_complete_execution" })
  });

  registerReportTokenUsageTool({
    server,
    client,
    logger: logger.child({ tool: "laviya_report_token_usage" })
  });

  return {
    server,
    runtimeConfig,
    logger,
    shutdown: () => {
      leaseManager.stop();
    }
  };
}
