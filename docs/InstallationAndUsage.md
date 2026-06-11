# End-User Installation and Usage Guide

This guide is for users who want to install and use `laviya-mcp-server`.

## 1. Prerequisites

- Node.js `>= 20.11.0`
- npm `>= 10`
- A valid `LAVIYA_API_KEY`

## 2. Install the Package

```bash
npm install -g laviya-mcp-server
```

Update:

```bash
npm update -g laviya-mcp-server
```

Uninstall:

```bash
npm uninstall -g laviya-mcp-server
```

## 3. Configure Environment Variables

Required:

- `LAVIYA_API_KEY`

Optional:

- `LAVIYA_BASE_URL`
- `LAVIYA_AGENT_UID`
- `LAVIYA_LOG_LEVEL`
- `LAVIYA_GLOBAL_CONFIG_PATH` (readable path override for global config file)

PowerShell:

```powershell
$env:LAVIYA_API_KEY = "your-api-key"
$env:LAVIYA_BASE_URL = "https://api.laviya.app"
$env:LAVIYA_LOG_LEVEL = "info"
```

Bash:

```bash
export LAVIYA_API_KEY="your-api-key"
export LAVIYA_BASE_URL="https://api.laviya.app"
export LAVIYA_LOG_LEVEL="info"
```

## 4. Global Runtime Configuration

The runtime automatically reads:

- Windows: `%USERPROFILE%\.laviya\config\global.json`
- macOS/Linux: `~/.laviya/config/global.json`

Example:

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

## 5. Project Configuration

Each repository should provide one of these files at or above the working directory:

- `.laviya/project.json` (recommended)
- `.laviya.json`

Minimal `project.json`:

```json
{
  "projectId": 1204,
  "agentProfile": "backend-implementer",
  "pollMode": "pull"
}
```

## 6. MCP Client Integration

`laviya-mcp-server` runs as a stdio MCP server.  
Your MCP client should launch `node` with the package entrypoint (`dist/index.js`).

Find global npm path:

```bash
npm root -g
```

Then configure your MCP client (example):

```json
{
  "servers": {
    "laviya": {
      "command": "node",
      "args": [
        "C:/Users/<user>/AppData/Roaming/npm/node_modules/laviya-mcp-server/dist/index.js"
      ],
      "env": {
        "LAVIYA_API_KEY": "${env:LAVIYA_API_KEY}",
        "LAVIYA_LOG_LEVEL": "info"
      }
    }
  }
}
```

If an optional environment variable (for example `LAVIYA_BASE_URL` or `LAVIYA_AGENT_UID`) is not set on your machine, omit it from the MCP `env` block or provide a concrete value.
If your runtime cannot access `%USERPROFILE%` / home directory (sandboxed environments), set `LAVIYA_GLOBAL_CONFIG_PATH` to a readable JSON file path.
If `LAVIYA_AGENT_UID` is set, it is used as the initial agent context; runtime then follows the latest `AIAgentUID` returned by API responses automatically.

Reference example: `mcp/examples/vscode/mcp.json`

## 7. Client-Specific MCP Setup

### 7.1 Codex CLI

Add the MCP server with `codex mcp add`:

```bash
codex mcp add laviya \
  --env LAVIYA_API_KEY=your-api-key \
  --env LAVIYA_BASE_URL=https://api.laviya.app \
  --env LAVIYA_LOG_LEVEL=info \
  -- npx -y laviya-mcp-server@0.1.20
```

Verify registration:

```bash
codex mcp list
codex mcp get laviya
```

Calling MCP tools from Codex chat:

- Be explicit that you want an MCP tool call.
- Do not send only the tool name, because plain text like `laviya_get_my_work` may be interpreted as normal chat text.

Example prompts:

- Important: MCP tool input is not raw HTTP body. Do not send `{"Data": {...}}` to MCP tools.
- For `laviya_complete_execution` and `laviya_report_token_usage`, send `{ "payload": { ... } }` with camelCase keys such as `taskID`, `aiAgentFlowRunID`, `executionSummary`, `isFailed`.

```text
Call MCP tool laviya_get_my_work with {} and return raw JSON.
```

```text
Call MCP tool laviya_get_my_work with {"includeFileBytes": false, "previousLogsLimit": 20, "output": {"minify": true, "omitFields": ["Data.PreviousWorks.Logs"]}}.
```

```text
Call MCP tool laviya_start_execution with {"runId": 1234, "taskId": 5678}.
```

```text
Call MCP tool laviya_feed_task with {"payload":{"taskID":5678}}.
```

```text
Call MCP tool laviya_get_local_work_status with {"runId":1234}.
```

```text
Call MCP tool laviya_cancel_local_work with {"payload":{"runID":1234,"reason":"Operator cancelled run"}}.
```

```text
Call MCP tool laviya_add_task_comment with {"payload":{"taskID":5678,"description":"Implemented the requested backend change, added tests, and verified the comment flow."}}.
```

```text
Call MCP tool laviya_complete_execution with {"payload":{"taskID":5678,"aiAgentFlowRunID":1234,"aiAgentTaskExecutionID":9012,"requestKey":"8b42b153-4767-401f-974d-f81f6700f54a","executionSummary":"{\"stepRole\":\"Developer\",\"task\":{\"taskId\":5678,\"runId\":1234,\"stepIndex\":1},\"outcome\":\"success\",\"deliverables\":[\"Implemented backend change\"],\"keyDecisions\":[\"Reused existing orchestration helpers\"],\"assumptions\":[],\"risks\":[],\"handoff\":{\"forNextStep\":\"Run integration validation.\",\"questions\":[],\"artifacts\":[\"src/services/example.ts\"]}}","isFailed":false}}.
```

```text
Call MCP tool laviya_complete_execution with {"payload":{"taskID":5678,"aiAgentFlowRunID":1234,"aiAgentTaskExecutionID":9012,"executionSummaryObject":{"stepRole":"Developer","task":{"taskId":5678,"runId":1234,"stepIndex":1},"outcome":"success","deliverables":["Implemented backend change"],"keyDecisions":["Reused existing orchestration helpers"],"assumptions":[],"risks":[],"handoff":{"forNextStep":"Run integration validation.","questions":[],"artifacts":["src/services/example.ts"]}},"isFailed":false}}.
```

```text
Call MCP tool laviya_report_token_usage with {"payload":{"taskID":5678,"aiAgentFlowRunID":1234,"aiAgentTaskExecutionID":9012,"tokenUsages":[{"model":"gpt-4.1-mini","inputTokens":220,"outputTokens":80,"totalTokens":300}]}}.
```

```text
Read MCP resource laviya://prompts/orchestrator.system.md and return the text.
```

```text
Call MCP prompt laviya_orchestrator_system_prompt and return the prompt messages.
```

If your Codex sandbox blocks `npx` with a home-directory error, register a direct Node command instead:

```bash
codex mcp remove laviya
codex mcp add laviya -- "C:/Program Files/nodejs/node.exe" "C:/Users/<user>/AppData/Roaming/npm/node_modules/laviya-mcp-server/dist/index.js"
```

Equivalent `~/.codex/config.toml` shape:

```toml
[mcp_servers.laviya]
command = "npx"
args = ["-y", "laviya-mcp-server@0.1.20"]

[mcp_servers.laviya.env]
LAVIYA_API_KEY = "your-api-key"
LAVIYA_BASE_URL = "https://api.laviya.app"
LAVIYA_LOG_LEVEL = "info"
```

### 7.2 VS Code

Use user-level MCP config at:

- Windows: `%APPDATA%\Code\User\mcp.json`

Example:

```json
{
  "servers": {
    "laviya-mcp-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "laviya-mcp-server@0.1.20"],
      "env": {
        "LAVIYA_API_KEY": "${env:LAVIYA_API_KEY}",
        "LAVIYA_BASE_URL": "https://api.laviya.app",
        "LAVIYA_LOG_LEVEL": "info"
      }
    }
  },
  "inputs": []
}
```

Reference example: `mcp/examples/vscode/mcp.json`

### 7.3 Antigravity (VS Code Extension)

Antigravity uses the same MCP server definition model as VS Code.  
Add the `laviya-mcp-server` entry in the same `mcp.json` file.
Do not include `"type": "stdio"` if your Antigravity schema rejects that field.

Recommended server block:

```json
{
  "command": "npx",
  "args": ["-y", "laviya-mcp-server@0.1.20"],
  "env": {
    "LAVIYA_API_KEY": "${env:LAVIYA_API_KEY}",
    "LAVIYA_BASE_URL": "https://api.laviya.app",
    "LAVIYA_LOG_LEVEL": "info"
  }
}
```

### 7.4 Claude

Register the same stdio MCP server in Claude MCP settings using `npx`:

```json
{
  "mcpServers": {
    "laviya": {
      "command": "npx",
      "args": ["-y", "laviya-mcp-server@0.1.20"],
      "env": {
        "LAVIYA_API_KEY": "your-api-key",
        "LAVIYA_BASE_URL": "https://api.laviya.app",
        "LAVIYA_LOG_LEVEL": "info"
      }
    }
  }
}
```

Then include the skill artifact:

- `mcp/examples/claude/SKILL.md`

## 8. Available MCP Tools

- `laviya_feed_task`
- `laviya_get_local_work_status`
- `laviya_cancel_local_work`
- `laviya_add_task_comment`
- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`

Typical lifecycle:

1. Optional local-direct bootstrap: call `laviya_feed_task` for flow-independent task feeding.
2. Optional monitoring/control: use `laviya_get_local_work_status` / `laviya_cancel_local_work`.
3. Optional self-managed delivery reporting: call `laviya_add_task_comment` when your own agent finishes work outside the orchestration lifecycle and only needs to publish its output to a task comment.
4. Call `laviya_get_my_work` to fetch work.
   - Read `Data.ExecutionPolicy` before taking any repository action.
   - `analysis` and `review` modes are read-only and must produce findings/handoff rather than implementation.
5. Call `laviya_start_execution` to begin execution.
6. Call `laviya_complete_execution` to finalize the task.
   - For enforced read-only policies, include truthful `executionEvidence` and matching `ExecutionSummary.policyCompliance`.
7. Call `laviya_report_token_usage` only when measured token data is available.

Tool response format:

- All tools return raw Laviya API envelope JSON as text:
  - `HasFailed: boolean`
  - `Messages: [{ Code?, Message }]`
  - `Data: object | null`
- If `HasFailed=true`, treat as failed call.
- For `laviya_get_my_work`, `Data=null` means no eligible work currently.

## 9. Common Issues

- `Invalid environment configuration`: missing or invalid `LAVIYA_API_KEY`.
- `Invalid project config`: invalid schema in `.laviya/project.json`.
- MCP connection errors: verify your configured command (`npx` or `node .../dist/index.js`) and `args`.
- `MCP startup failed ... initialize response` with permission errors (`EPERM`, `EACCES`, `os error 5`):
  - ensure the runtime process can access Node/npm and the configured config paths
  - set `LAVIYA_GLOBAL_CONFIG_PATH` to a readable file
  - if using Codex sandbox, retry with escalation when process spawn is blocked

