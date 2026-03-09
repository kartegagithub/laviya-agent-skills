# 1. Architecture Summary

Laviya AI Orchestration Developer Runtime is implemented as a single machine-level Node.js + TypeScript MCP server package (`laviya-mcp-server`).  
Each repository provides only a lightweight local config (`.laviya/project.json` or `.laviya.json`) plus optional prompt/rule overrides.

This is the recommended production model:

- Global shared runtime: installed once per developer machine.
- Project-local config: small, explicit, and secret-free.
- MCP-first integration: IDEs/agents call MCP tools, not raw API.
- Runtime-enforced mechanics: retries, timeout, idempotency, lease refresh, validation, logging.

# 2. Why This Architecture

Global runtime is better than copying orchestration files into every repo because it provides:

- Single upgrade path for bug fixes and security updates.
- Consistent behavior across all projects and IDE clients.
- Cleaner semver release and rollback discipline.
- Lower onboarding time for new projects.
- Centralized governance for enterprise controls.
- No secret sprawl in repository files.

Copy-per-repo designs create drift, slow upgrades, repeated fixes, and inconsistent runtime behavior.

# 3. Responsibility Split

Global shared runtime responsibilities:

- MCP server bootstrap and tool registration.
- Laviya API client and payload shaping.
- Environment loading and secret access.
- Global defaults and config merge behavior.
- Retry, timeout, and idempotency handling.
- Execution lease refresh management.
- Structured logging and diagnostics hooks.
- Runtime validation of configs and tool inputs.
- Base orchestration prompt and schemas.
- Token usage reporting plumbing.

Project-local responsibilities:

- `projectId`, optional `projectName`.
- `agentProfile`.
- `pollMode`.
- `runPinning`.
- Prompt override path.
- Repo-specific rule/coding reference paths.
- Completion toggles (logs/token usage behavior).

# 4. Folder Structures

Machine/global install layout:

```text
Windows
%APPDATA%\npm\node_modules\@laviya\mcp-server\
%USERPROFILE%\.laviya\config\global.json

macOS/Linux
~/.npm-global/lib/node_modules/laviya-mcp-server/
~/.laviya/config/global.json
```

Runtime package structure:

```text
mcp/
  src/
    client/
    config/
    orchestration/
    tools/
    prompts/
    schemas/
    utils/
  examples/
    cursor/
    claude/
    vscode/
```

Per-project local structure:

```text
<repo>/
  .laviya/
    project.json
    prompts/
      override.system.md
  .cursor/
    rules/
      laviya-project.mdc
  .vscode/
    settings.json
```

# 5. Global Config Model

Global config path:

`~/.laviya/config/global.json` (or `%USERPROFILE%\.laviya\config\global.json`)

Global config example:

```json
{
  "baseUrl": "https://api.laviya.app",
  "defaultPollIntervalSeconds": 15,
  "defaultLeaseRefreshSeconds": 30,
  "requestTimeoutSeconds": 30,
  "logLevel": "info",
  "auth": {
    "mode": "apiKeyAndBearer",
    "headerName": "X-API-Key",
    "sendBearerToken": true
  },
  "retry": {
    "maxAttempts": 3,
    "baseDelayMs": 500,
    "maxDelayMs": 5000,
    "jitter": true,
    "retryOnHttpStatus": [408, 409, 425, 429, 500, 502, 503, 504]
  }
}
```

Recommended TypeScript shape:

```ts
interface GlobalConfig {
  baseUrl: string;
  defaultPollIntervalSeconds: number;
  defaultLeaseRefreshSeconds: number;
  requestTimeoutSeconds: number;
  logLevel: "debug" | "info" | "warn" | "error";
  auth: {
    mode: "apiKey" | "apiKeyAndBearer";
    headerName: string;
    sendBearerToken: boolean;
  };
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitter: boolean;
    retryOnHttpStatus: number[];
  };
}
```

Schema file: `src/schemas/globalConfig.schema.json`

# 6. Project Config Model

Project config paths:

- `.laviya/project.json`
- `.laviya.json`

Minimal example:

```json
{
  "projectId": 1204,
  "agentProfile": "backend-implementer",
  "pollMode": "pull"
}
```

Advanced example:

```json
{
  "projectId": 1204,
  "projectName": "Laviya Backend",
  "agentProfile": "platform-orchestrator",
  "pollMode": "long-poll",
  "runPinning": {
    "enabled": true,
    "runId": 987654
  },
  "promptOverridePath": ".laviya/prompts/override.system.md",
  "completion": {
    "requireExecutionSummary": true,
    "autoFailOnMissingSummary": true,
    "includeLogs": true,
    "includeTokenUsage": true
  },
  "codingRules": {
    "cursorRulePath": ".cursor/rules/laviya-project.mdc",
    "vscodeSettingsPath": ".vscode/settings.json",
    "codingConventionsPath": "docs/coding-conventions.md"
  }
}
```

Recommended TypeScript shape:

```ts
interface ProjectConfig {
  projectId: number;
  projectName?: string;
  agentProfile: string;
  pollMode?: "pull" | "long-poll";
  runPinning?: {
    enabled: boolean;
    runId?: number;
  };
  promptOverridePath?: string;
  completion?: {
    requireExecutionSummary?: boolean;
    autoFailOnMissingSummary?: boolean;
    includeLogs?: boolean;
    includeTokenUsage?: boolean;
  };
  codingRules?: {
    cursorRulePath?: string;
    vscodeSettingsPath?: string;
    codingConventionsPath?: string;
  };
}
```

Schema file: `src/schemas/projectConfig.schema.json`

# 7. Environment Variables

Required:

- `LAVIYA_API_KEY`

Optional:

- `LAVIYA_BASE_URL`
- `LAVIYA_AGENT_UID`
- `LAVIYA_LOG_LEVEL`

Examples:

```bash
export LAVIYA_API_KEY="***"
export LAVIYA_BASE_URL="https://api.laviya.app"
export LAVIYA_AGENT_UID="optional-agent-uid"
export LAVIYA_LOG_LEVEL="info"
```

Secrets must remain in environment variables, not repo config files.  
Merge order in runtime:

- Env overrides global config for `baseUrl` and `logLevel`.
- Global config provides runtime defaults.
- Project config supplies project-scoped behavior and IDs.

# 8. Runtime Behavior

Runtime responsibilities implemented in code:

- Load and validate env vars.
- Load global config with defaults.
- Discover nearest project config from current working directory.
- Load base prompt, then append optional project override prompt.
- Initialize API client with retries, timeout, auth headers, and idempotency.
- Generate deterministic request keys for completion and token reporting.
- Refresh execution lease on interval with fallback behavior.
- Enforce execution summary presence when configured.
- Enforce token reporting as measured input only.
- Emit structured JSON logs with level filtering.
- Expose diagnostics context (`cwd`, config paths, poll mode) on startup.

# 9. MCP Server Design

MCP tools exposed:

- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`

Tool contracts:

- `laviya_get_my_work`
  - Input: `runId?`, `projectId?`
  - Behavior: resolves defaults from runtime/project config and polls work.
  - Output: raw Laviya API payload as JSON text.
  - Error strategy: validates input, logs error, throws tool error.
- `laviya_start_execution`
  - Input: `runId`, `taskId`, `executionId?`
  - Behavior: starts execution and starts local lease refresh timer.
  - Output: start execution API payload.
  - Error strategy: input validation + structured error logging.
- `laviya_complete_execution`
  - Input: full completion payload.
  - Behavior: validates payload, generates idempotency key if missing, enforces completion policy, stops lease manager.
  - Output: completion API response.
  - Error strategy: fail fast on invalid payload or summary policy violation.
- `laviya_report_token_usage`
  - Input: token usage payload.
  - Behavior: validates non-empty usage list and posts report with deterministic key.
  - Output: token report response.
  - Error strategy: validation + structured errors.

# 10. Prompt Design

Base prompt location:

`src/prompts/orchestrator.system.md`

Prompt design principles:

- Keep lifecycle mechanics in runtime code, not prompt text.
- Require MCP tools; forbid raw arbitrary HTTP from agent.
- Require respecting `PreviousWorks` and orchestration context fields.
- Require honoring work-item language fields (`AgentWorkLanguageIsoCode` / `AgentWorkLanguageCultureCode`) for user-facing outputs.
- Require structured JSON `ExecutionSummary`.
- Require explicit success/failure completion and clear handoff.
- Forbid invented token usage and invented API outputs.

Project override mechanism:

- Project config sets `promptOverridePath`.
- Runtime loads base prompt first.
- Runtime appends override block (`## Project Override`) without forking core prompt.

# 11. Project Customization

Allowed project-local customization:

- `projectId`
- `agentProfile`
- `pollMode`
- `runPinning`
- `promptOverridePath`
- optional coding rule references
- completion preferences

Not allowed in project-local config:

- API keys
- full runtime behavior duplication
- transport/client internals

# 12. Distribution and Installation

Recommended package names:

- `laviya-mcp-server`
- `laviya-mcp-server`

Commands:

```bash
npm install -g laviya-mcp-server
npm update -g laviya-mcp-server
npm run dev
npm run build && npm start
```

VS Code integration:

- Use `examples/vscode/mcp.json` as MCP server definition.

Codex integration:

- Register the server with `codex mcp add` and run `laviya-mcp-server` via `npx`.
- Reference: `../docs/InstallationAndUsage.md` (Client-Specific MCP Setup > Codex CLI).

Antigravity integration:

- Use the same stdio MCP server definition used for VS Code (`mcp.json` user config).
- Reference: `../docs/InstallationAndUsage.md` (Client-Specific MCP Setup > Antigravity).

Cursor integration:

- Use same MCP server plus repo-local rule file (`.cursor/rules/laviya-project.mdc`).

Claude Code integration:

- Use `examples/claude/SKILL.md` and point tooling to the same MCP runtime.
- Reference: `../docs/InstallationAndUsage.md` (Client-Specific MCP Setup > Claude).

# 13. Production Readiness

Recommendations:

- Follow semver strictly (`MAJOR.MINOR.PATCH`).
- Keep structured logs JSON-first for ingestion.
- Add OpenTelemetry traces/metrics incrementally.
- Use exponential backoff with jitter for retriable responses.
- Keep request timeout default at 30s, override by global config.
- Validate all config/tool inputs at runtime.
- Maintain backward-compatible tool contracts across minor releases.
- Use local dev flow: `npm run dev` with staged backend.
- Add unit tests for config merge and request key generation.
- Add integration tests for MCP tools against staging.
- Automate releases and changelog generation.
- Keep support runbooks for diagnostics and common failures.

# 14. Scaffolding Files

Implemented files in this scaffold:

```text
1.  package.json
2.  tsconfig.json
3.  src/index.ts
4.  src/server.ts
5.  src/config/loadGlobalConfig.ts
6.  src/config/loadProjectConfig.ts
7.  src/config/mergeConfig.ts
8.  src/client/laviyaApiClient.ts
9.  src/orchestration/getMyWork.ts
10. src/orchestration/startExecution.ts
11. src/orchestration/completeExecution.ts
12. src/orchestration/reportTokenUsage.ts
13. src/orchestration/leaseManager.ts
14. src/tools/getMyWorkTool.ts
15. src/tools/startExecutionTool.ts
16. src/tools/completeExecutionTool.ts
17. src/tools/reportTokenUsageTool.ts
18. src/prompts/orchestrator.system.md
19. src/utils/env.ts
20. src/utils/logger.ts
21. src/utils/requestKey.ts
22. src/utils/json.ts
23. src/schemas/projectConfig.schema.json
24. src/schemas/globalConfig.schema.json
25. src/schemas/executionSummary.schema.json
26. src/schemas/completeExecution.schema.json
27. examples/global.json
28. examples/project.json
29. examples/project-advanced.json
30. examples/override.system.md
31. examples/cursor/laviya-project.mdc
32. examples/claude/SKILL.md
33. examples/vscode/mcp.json
34. README.md
```

# 15. Usage Instructions

One-time machine setup:

1. Install Node.js 20+.
2. Install runtime package globally.
3. Create global config at `~/.laviya/config/global.json`.
4. Set environment variables (`LAVIYA_API_KEY` required).

Per-project setup:

1. Add `.laviya/project.json` (or `.laviya.json`).
2. Optionally add prompt override file and IDE rule files.
3. Start IDE/agent with MCP server reference.

Run locally:

```bash
cd mcp
npm install
npm run dev
```

Config discovery behavior:

- Runtime walks upward from current working directory.
- First match wins: `.laviya/project.json`, then `.laviya.json`.

IDE integration behavior:

- IDE sends MCP tool calls to runtime.
- Runtime resolves local project config automatically.
- Runtime calls Laviya backend and returns typed responses.

# 16. Non-Technical Summary

This design installs one shared AI runtime per machine and keeps each project configuration lightweight.  
It reduces maintenance cost because updates, bug fixes, and security improvements happen once, centrally.  
It also improves rollout and support by giving every team the same reliable behavior while still allowing project-specific settings.
