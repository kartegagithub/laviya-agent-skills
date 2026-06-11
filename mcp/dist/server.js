import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LaviyaApiClient } from "./client/laviyaApiClient.js";
import { buildRuntimeConfig } from "./config/mergeConfig.js";
import { LeaseManager } from "./orchestration/leaseManager.js";
import { ExecutionPolicyManager } from "./orchestration/executionPolicyManager.js";
import { registerAddTaskCommentTool } from "./tools/addTaskCommentTool.js";
import { registerCancelLocalWorkTool } from "./tools/cancelLocalWorkTool.js";
import { registerOrchestratorPromptAssets } from "./prompts/registerOrchestratorPromptAssets.js";
import { registerCompleteExecutionTool } from "./tools/completeExecutionTool.js";
import { registerFeedTaskTool } from "./tools/feedTaskTool.js";
import { registerGetLocalWorkStatusTool } from "./tools/getLocalWorkStatusTool.js";
import { registerGetMyWorkTool } from "./tools/getMyWorkTool.js";
import { registerReportTokenUsageTool } from "./tools/reportTokenUsageTool.js";
import { registerStartExecutionTool } from "./tools/startExecutionTool.js";
import { registerDiagnosticsTool } from "./tools/diagnosticsTool.js";
import { registerHelpTool } from "./tools/helpTool.js";
import { createLogger } from "./utils/logger.js";
import { SERVER_VERSION } from "./version.js";
const SERVER_NAME = "laviya-orchestrator-runtime";
export async function createRuntimeServer(options = {}) {
    const runtimeConfig = await buildRuntimeConfig(options);
    const logger = createLogger(runtimeConfig.logLevel, {
        service: SERVER_NAME
    });
    for (const warning of runtimeConfig.configWarnings) {
        logger.warn(warning);
    }
    logger.info("Runtime configuration loaded", {
        cwd: runtimeConfig.cwd,
        projectRoot: runtimeConfig.projectRoot,
        projectConfigPath: runtimeConfig.projectConfigPath,
        globalConfigPath: runtimeConfig.globalConfigPath,
        pollMode: runtimeConfig.pollMode,
        configWarningCount: runtimeConfig.configWarnings.length
    });
    const client = new LaviyaApiClient({
        baseUrl: runtimeConfig.baseUrl,
        apiKey: runtimeConfig.apiKey,
        agentUid: runtimeConfig.agentUid,
        retry: runtimeConfig.retry,
        requestTimeoutSeconds: runtimeConfig.requestTimeoutSeconds,
        logger: logger.child({ component: "api-client" })
    });
    const leaseManager = new LeaseManager(client, logger.child({ component: "lease-manager" }), runtimeConfig.leaseRefreshSeconds);
    const executionPolicyManager = new ExecutionPolicyManager();
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION
    });
    registerOrchestratorPromptAssets({
        server,
        runtimeConfig,
        logger: logger.child({ component: "prompt-assets" })
    });
    registerFeedTaskTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_feed_task" })
    });
    registerGetLocalWorkStatusTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_get_local_work_status" })
    });
    registerCancelLocalWorkTool({
        server,
        client,
        leaseManager,
        logger: logger.child({ tool: "laviya_cancel_local_work" })
    });
    registerAddTaskCommentTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_add_task_comment" })
    });
    registerGetMyWorkTool({
        server,
        client,
        runtimeConfig,
        executionPolicyManager,
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
        executionPolicyManager,
        logger: logger.child({ tool: "laviya_complete_execution" })
    });
    registerReportTokenUsageTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_report_token_usage" })
    });
    registerDiagnosticsTool({
        server,
        runtimeConfig,
        leaseManager,
        logger: logger.child({ tool: "laviya_diagnostics" }),
        serverVersion: SERVER_VERSION
    });
    registerHelpTool({
        server,
        logger: logger.child({ tool: "laviya_help" })
    });
    let shutdownPromise;
    return {
        server,
        runtimeConfig,
        logger,
        shutdown: () => {
            shutdownPromise ??= (async () => {
                logger.info("Shutting down MCP runtime");
                leaseManager.stopAll();
                client.shutdown();
                await server.close();
                logger.info("MCP runtime shutdown complete");
            })();
            return shutdownPromise;
        }
    };
}
//# sourceMappingURL=server.js.map