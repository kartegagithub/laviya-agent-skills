import { executeTool } from "../mcp/result.js";
import { toolResultOutputSchema } from "../mcp/toolMetadata.js";
export function registerDiagnosticsTool(deps) {
    deps.server.registerTool("laviya_diagnostics", {
        title: "Laviya Diagnostics",
        description: "Read secret-free runtime configuration and active lease diagnostics.",
        outputSchema: toolResultOutputSchema,
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: false
        }
    }, async () => executeTool("laviya_diagnostics", deps.logger, async () => {
        const leases = deps.leaseManager.getActiveContexts();
        return {
            serverVersion: deps.serverVersion,
            projectRoot: deps.runtimeConfig.projectRoot,
            projectConfigPath: deps.runtimeConfig.projectConfigPath,
            globalConfigPath: deps.runtimeConfig.globalConfigPath,
            baseUrlHost: new URL(deps.runtimeConfig.baseUrl).host,
            authMode: "query",
            tokenUsage: deps.runtimeConfig.completion.includeTokenUsage
                ? "optional-enabled"
                : "optional-disabled",
            activeLeaseCount: leases.length,
            activeLeases: leases,
            configWarnings: deps.runtimeConfig.configWarnings
        };
    }));
}
//# sourceMappingURL=diagnosticsTool.js.map