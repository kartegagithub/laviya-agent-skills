const ORCHESTRATOR_PROMPT_NAME = "laviya_orchestrator_system_prompt";
const ORCHESTRATOR_PROMPT_RESOURCE_NAME = "laviya_orchestrator_system_prompt_resource";
const ORCHESTRATOR_PROMPT_RESOURCE_URI = "laviya://prompts/orchestrator.system.md";
export function registerOrchestratorPromptAssets(deps) {
    deps.server.registerResource(ORCHESTRATOR_PROMPT_RESOURCE_NAME, ORCHESTRATOR_PROMPT_RESOURCE_URI, {
        title: "Laviya Orchestrator System Prompt Resource",
        description: "Resolved orchestration system prompt from runtime config (base prompt plus optional project override).",
        mimeType: "text/markdown"
    }, async () => ({
        contents: [
            {
                uri: ORCHESTRATOR_PROMPT_RESOURCE_URI,
                mimeType: "text/markdown",
                text: deps.runtimeConfig.prompt.content
            }
        ]
    }));
    deps.server.registerPrompt(ORCHESTRATOR_PROMPT_NAME, {
        title: "Laviya Orchestrator System Prompt",
        description: "Returns the resolved orchestration system prompt loaded by this runtime instance."
    }, async () => ({
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: deps.runtimeConfig.prompt.content
                }
            }
        ]
    }));
    deps.logger.info("Registered orchestrator prompt assets", {
        promptName: ORCHESTRATOR_PROMPT_NAME,
        resourceName: ORCHESTRATOR_PROMPT_RESOURCE_NAME,
        resourceUri: ORCHESTRATOR_PROMPT_RESOURCE_URI,
        promptBasePath: deps.runtimeConfig.prompt.basePath,
        promptOverridePath: deps.runtimeConfig.prompt.overridePath
    });
}
//# sourceMappingURL=registerOrchestratorPromptAssets.js.map