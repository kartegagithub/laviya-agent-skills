import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LaviyaApiClient } from "./client/laviyaApiClient.js";
import { buildRuntimeConfig } from "./config/mergeConfig.js";
import { LeaseManager } from "./orchestration/leaseManager.js";
import { ExecutionPolicyManager } from "./orchestration/executionPolicyManager.js";
import { registerAddTaskCommentTool } from "./tools/addTaskCommentTool.js";
import { registerCancelLocalWorkTool } from "./tools/cancelLocalWorkTool.js";
import { registerOrchestratorPromptAssets } from "./prompts/registerOrchestratorPromptAssets.js";
import { registerCompleteExecutionTool } from "./tools/completeExecutionTool.js";
import { registerCreateTasksTool } from "./tools/createTasksTool.js";
import { registerListProjectsTool } from "./tools/listProjectsTool.js";
import { registerListTasksTool } from "./tools/listTasksTool.js";
import { registerFeedTaskTool } from "./tools/feedTaskTool.js";
import { registerGetLocalWorkStatusTool } from "./tools/getLocalWorkStatusTool.js";
import { registerGetMyWorkTool } from "./tools/getMyWorkTool.js";
import { registerReportTokenUsageTool } from "./tools/reportTokenUsageTool.js";
import { registerStartExecutionTool } from "./tools/startExecutionTool.js";
import { registerStartTaskWorkTool } from "./tools/startTaskWorkTool.js";
import { registerCompleteTaskWorkTool } from "./tools/completeTaskWorkTool.js";
import { registerStartDeliveryRunTool } from "./tools/startDeliveryRunTool.js";
import { registerUploadTaskFileTool } from "./tools/uploadTaskFileTool.js";
import { registerGetTaskTool } from "./tools/getTaskTool.js";
import { registerUpdateTaskDescriptionTool } from "./tools/updateTaskDescriptionTool.js";
import { registerAssignTaskTool } from "./tools/assignTaskTool.js";
import { registerListSprintsTool } from "./tools/listSprintsTool.js";
import { registerCreateSprintTool } from "./tools/createSprintTool.js";
import { registerAssignTasksToSprintTool } from "./tools/assignTasksToSprintTool.js";
import { registerListTaskLinksTool } from "./tools/listTaskLinksTool.js";
import { registerAddTaskLinkTool } from "./tools/addTaskLinkTool.js";
import { registerRemoveTaskLinkTool } from "./tools/removeTaskLinkTool.js";
import { registerListTestCasesTool } from "./tools/listTestCasesTool.js";
import { registerCreateTestCasesTool } from "./tools/createTestCasesTool.js";
import { registerReportTestResultTool } from "./tools/reportTestResultTool.js";
import { registerListWikisTool } from "./tools/listWikisTool.js";
import { registerGetWikiTool } from "./tools/getWikiTool.js";
import { registerCreateWikiTool } from "./tools/createWikiTool.js";
import { registerUpdateWikiTool } from "./tools/updateWikiTool.js";
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
    const configuredProfile = runtimeConfig.projectConfig?.agentProfile?.trim().toLowerCase();
    const exposeManagementTools = !configuredProfile || configuredProfile.includes("orchestrator") || configuredProfile.includes("manager");
    if (exposeManagementTools) {
        registerFeedTaskTool({ server, client, logger: logger.child({ tool: "laviya_feed_task" }) });
        registerGetLocalWorkStatusTool({ server, client, logger: logger.child({ tool: "laviya_get_local_work_status" }) });
        registerCancelLocalWorkTool({ server, client, leaseManager, logger: logger.child({ tool: "laviya_cancel_local_work" }) });
        registerAddTaskCommentTool({ server, client, logger: logger.child({ tool: "laviya_add_task_comment" }), projectRoot: runtimeConfig.projectRoot });
        registerReportTokenUsageTool({ server, client, logger: logger.child({ tool: "laviya_report_token_usage" }) });
    }
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
    // Registered for every agent profile: the delivery cycle (create approved tasks, report completion) is user-driven,
    // not orchestration management.
    registerListProjectsTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_list_projects" })
    });
    registerCreateTasksTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_create_tasks" })
    });
    registerListTasksTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_list_tasks" })
    });
    registerGetTaskTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_get_task" })
    });
    registerUploadTaskFileTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_upload_task_file" }),
        projectRoot: runtimeConfig.projectRoot
    });
    registerUpdateTaskDescriptionTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_update_task_description" }),
        projectRoot: runtimeConfig.projectRoot
    });
    registerAssignTaskTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_assign_task" })
    });
    registerListSprintsTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_list_sprints" })
    });
    registerCreateSprintTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_create_sprint" })
    });
    registerAssignTasksToSprintTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_assign_tasks_to_sprint" })
    });
    registerListTaskLinksTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_list_task_links" })
    });
    registerAddTaskLinkTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_add_task_link" })
    });
    registerRemoveTaskLinkTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_remove_task_link" })
    });
    registerListTestCasesTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_list_test_cases" })
    });
    registerCreateTestCasesTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_create_test_cases" })
    });
    registerReportTestResultTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_report_test_result" }),
        projectRoot: runtimeConfig.projectRoot
    });
    registerListWikisTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_list_wikis" })
    });
    registerGetWikiTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_get_wiki" })
    });
    registerCreateWikiTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_create_wiki" })
    });
    registerUpdateWikiTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_update_wiki" })
    });
    registerStartDeliveryRunTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_start_delivery_run" })
    });
    registerStartTaskWorkTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_start_task_work" })
    });
    registerCompleteTaskWorkTool({
        server,
        client,
        logger: logger.child({ tool: "laviya_complete_task_work" })
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