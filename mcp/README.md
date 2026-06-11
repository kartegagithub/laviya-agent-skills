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
- Global completion defaults (`includeTokenUsage`).

Project-local responsibilities:

- `projectId`, optional `projectName`.
- `agentProfile`.
- `pollMode` compatibility metadata (`long-poll` currently behaves as host-driven pull).
- `runPinning`.
- Prompt override path.
- Repo-specific rule/coding reference paths (accepted for compatibility, not loaded by runtime).
- Completion behavior overrides (logs/token usage behavior).

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
  "retry": {
    "maxAttempts": 3,
    "baseDelayMs": 500,
    "maxDelayMs": 5000,
    "jitter": true,
    "retryOnHttpStatus": [408, 409, 425, 429, 500, 502, 503, 504]
  },
  "completion": {
    "includeTokenUsage": true
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
  retry: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitter: boolean;
    retryOnHttpStatus: number[];
  };
  completion?: {
    includeTokenUsage?: boolean;
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
- `LAVIYA_GLOBAL_CONFIG_PATH` (readable path override for global config file)

Examples:

```bash
export LAVIYA_API_KEY="***"
export LAVIYA_BASE_URL="https://api.laviya.app"
export LAVIYA_AGENT_UID="optional-agent-uid"
export LAVIYA_LOG_LEVEL="info"
```

`LAVIYA_AGENT_UID` is used as the initial agent context. Discovered `AIAgentUID` values are isolated by
run so parallel executions cannot overwrite each other's agent context.

Secrets must remain in environment variables, not repo config files.  
The runtime sends `apiKey` and, when available, `agentUID` only as query parameters expected by the
Laviya AI orchestration endpoints. It does not send `Authorization`, `X-API-Key`, or `X-Agent-UID`
headers. Request redirects are refused so query credentials cannot be forwarded to another origin.
Production base URLs must use HTTPS; HTTP is accepted only for loopback development addresses.
Legacy global `auth` objects are accepted temporarily for migration, but ignored with a warning.

Merge order in runtime:

- Env overrides global config for `baseUrl` and `logLevel`.
- Global config provides runtime defaults (including `completion` defaults).
- Project config supplies project-scoped behavior and IDs, and overrides any global `completion` settings.

# 8. Runtime Behavior

Runtime responsibilities implemented in code:

- Load and validate env vars.
- Load global config with defaults.
- Discover nearest project config from current working directory.
- Load base prompt, then append optional project override prompt.
- Expose resolved prompt text through MCP prompt/resource endpoints.
- Initialize API client with retries, timeout, query-only auth (`apiKey`, `agentUID`) and idempotency.
- Redact API keys and summarize agent identifiers in structured logs and error contexts.
- Refuse HTTP redirects and unsafe non-loopback HTTP base URLs.
- Parse the backend envelope centrally and map `HasFailed: true` to MCP `isError: true`.
- Return successful tool output as text plus `structuredContent`.
- Generate canonical full-payload request keys for completion and token reporting.
- Track leases independently by run/task/execution, without overlapping refresh calls.
- Pause only the completing lease and resume it when completion fails.
- Validate structured execution summaries and completion identity/outcome consistency.
- Capture backend `ExecutionPolicy` per run/task and enforce read-only completion evidence before API submission.
- Keep token reporting optional; validate measured values only when supplied.
- Emit structured JSON logs with level filtering.
- Expose secret-free runtime state through `laviya_diagnostics`.
- Abort active API calls and close leases/transport during graceful shutdown.

# 9. MCP Server Design

MCP tools exposed:

- `laviya_help`
- `laviya_feed_task`
- `laviya_get_local_work_status`
- `laviya_cancel_local_work`
- `laviya_add_task_comment`
- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`
- `laviya_diagnostics`

Call `laviya_help` without arguments to receive every tool's purpose and a valid
example call. Pass `toolName` to return help for a single tool.

MCP prompt/resource exposed:

- Prompt: `laviya_orchestrator_system_prompt`
- Resource URI: `laviya://prompts/orchestrator.system.md`

Tool contracts:

- `laviya_feed_task`
  - Input: `{ payload: { taskID } }` (strict: no extra payload keys)
  - Behavior: starts or reuses a hidden local-direct run for flow-independent task execution.
  - Output: API envelope JSON (`HasFailed`, `Messages`, `Data`) with feed/run metadata.
  - Error strategy: payload validation + backend business rule propagation.
- `laviya_get_local_work_status`
  - Input: `runId`
  - Behavior: reads run status, latest execution status, and generated artifact counters.
  - Output: API envelope JSON (`HasFailed`, `Messages`, `Data`).
  - Error strategy: input validation and MCP `isError` result.
- `laviya_cancel_local_work`
  - Input: `{ payload: { runID, reason? } }`
  - Behavior: cancels local-direct run and active execution leases.
  - Output: API envelope JSON (`HasFailed`, `Messages`, `Data`) with final status snapshot.
  - Error strategy: payload validation and MCP `isError` result.
- `laviya_add_task_comment`
  - Input: `{ payload: { taskID, description } }`
  - Behavior: appends self-managed agent output to the target task as a comment without entering orchestration lifecycle.
  - Output: API envelope JSON (`HasFailed`, `Messages`, `Data`) with created task comment metadata.
  - Error strategy: payload validation + backend business rule propagation. Automatic retry is intentionally disabled to avoid duplicate comments.
- `laviya_get_my_work`
  - Input: `runId?`, `projectId?`, `includeFileBytes?`, `previousLogsLimit?`, `output?`
  - Behavior: resolves defaults from runtime/project config, polls work, captures the step `ExecutionPolicy`, and supports lite payload defaults.
  - Output: API envelope JSON (`HasFailed`, `Messages`, `Data`) as text; minified by default with optional field omission.
  - Error strategy: validation, backend envelope parsing, and MCP `isError` result.
- `laviya_start_execution`
  - Input: `runId`, `taskId`, `executionId?`
  - Behavior: starts execution and registers an independently keyed local lease.
  - Output: start execution API payload.
  - Error strategy: input validation + structured error logging.
- `laviya_complete_execution`
  - Input: `{ payload: <full completion payload> }` (no HTTP `Data` envelope).
  - Required payload key casing follows tool schema (for example `taskID`, `aiAgentFlowRunID`, `executionSummary`, `isFailed`).
  - Behavior: validates payload/summary and policy evidence, generates a canonical idempotency key, pauses the matching
    lease, and removes it only after successful completion.
  - Output: completion API response.
  - Error strategy: fail fast on invalid payload or summary policy violation.
- `laviya_report_token_usage`
  - Input: `{ payload: <token usage payload> }` (no HTTP `Data` envelope).
  - Required payload key casing follows tool schema (for example `taskID`, `aiAgentFlowRunID`, `tokenUsages`).
  - Behavior: optional standalone reporting; validates supplied measured usage and posts with a
    canonical deterministic key.
  - Output: token report response.
  - Error strategy: validation + structured errors.
- `laviya_diagnostics`
  - Input: none.
  - Behavior: returns version, config sources, API host, warnings, and active lease summaries without secrets.
  - Annotation: read-only and idempotent.

# 10. Prompt Design

Base prompt location:

`src/prompts/orchestrator.system.md`

Prompt design principles:

- Keep lifecycle mechanics in runtime code, not prompt text.
- Require MCP tools; forbid raw arbitrary HTTP from agent.
- Require respecting `PreviousWorks` and orchestration context fields.
- Treat backend `ExecutionPolicy` as a binding capability boundary.
- Forbid workspace writes and implementation during `analysis` and `review` modes.
- Require matching `executionEvidence` and `ExecutionSummary.policyCompliance` for enforced read-only steps.
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
- Run `npm run typecheck`, `npm test`, `npm run build`, and `npm pack --dry-run` before release.
- Keep the GitHub Actions MCP gate and dependency audit passing.
- Add staging API contract tests in addition to the local MCP integration suite.
- Automate changelog generation.
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
13. src/orchestration/feedTask.ts
14. src/orchestration/getLocalWorkStatus.ts
15. src/orchestration/cancelLocalWork.ts
16. src/orchestration/leaseManager.ts
17. src/tools/getMyWorkTool.ts
18. src/tools/startExecutionTool.ts
19. src/tools/completeExecutionTool.ts
20. src/tools/reportTokenUsageTool.ts
21. src/tools/feedTaskTool.ts
22. src/tools/getLocalWorkStatusTool.ts
23. src/tools/cancelLocalWorkTool.ts
24. src/prompts/orchestrator.system.md
25. src/utils/env.ts
26. src/utils/logger.ts
27. src/utils/requestKey.ts
28. src/utils/json.ts
29. src/schemas/projectConfig.schema.json
30. src/schemas/globalConfig.schema.json
31. src/schemas/executionSummary.schema.json
32. src/schemas/completeExecution.schema.json
33. examples/global.json
34. examples/project.json
35. examples/project-advanced.json
36. examples/override.system.md
37. examples/cursor/laviya-project.mdc
38. examples/claude/SKILL.md
39. examples/vscode/mcp.json
40. README.md
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
