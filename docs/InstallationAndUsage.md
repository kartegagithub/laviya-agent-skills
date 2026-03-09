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

Reference example: `mcp/examples/vscode/mcp.json`

## 7. Client-Specific MCP Setup

### 7.1 Codex CLI

Add the MCP server with `codex mcp add`:

```bash
codex mcp add laviya \
  --env LAVIYA_API_KEY=your-api-key \
  --env LAVIYA_BASE_URL=https://api.laviya.app \
  --env LAVIYA_LOG_LEVEL=info \
  -- npx -y laviya-mcp-server@0.1.11
```

Verify registration:

```bash
codex mcp list
codex mcp get laviya
```

Equivalent `~/.codex/config.toml` shape:

```toml
[mcp_servers.laviya]
command = "npx"
args = ["-y", "laviya-mcp-server@0.1.11"]

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
      "args": ["-y", "laviya-mcp-server@0.1.11"],
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
  "args": ["-y", "laviya-mcp-server@0.1.11"],
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
      "args": ["-y", "laviya-mcp-server@0.1.11"],
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

- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`

Typical lifecycle:

1. Call `laviya_get_my_work` to fetch work.
2. Call `laviya_start_execution` to begin execution.
3. Call `laviya_complete_execution` to finalize the task.
4. Call `laviya_report_token_usage` when token reporting is required.

## 9. Common Issues

- `Invalid environment configuration`: missing or invalid `LAVIYA_API_KEY`.
- `Invalid project config`: invalid schema in `.laviya/project.json`.
- MCP connection errors: verify your configured command (`npx` or `node .../dist/index.js`) and `args`.
