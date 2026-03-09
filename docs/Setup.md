# Laviya Agent Skills Setup Guide

This document explains how to run the `laviya-agent-skills` repository in a local development environment.

## 1. Prerequisites

- Node.js `>= 20.11.0`
- npm `>= 10`
- A valid `LAVIYA_API_KEY`

Verify your local runtime:

```bash
node -v
npm -v
```

## 2. Install and Build MCP Runtime

```bash
cd laviya-agent-skills/mcp
npm install
npm run typecheck
npm run build
```

Run in development mode:

```bash
npm run dev
```

Run in production-style mode:

```bash
npm run build
npm start
```

## 3. Configure Environment Variables

`LAVIYA_API_KEY` is required. The rest are optional:

- `LAVIYA_API_KEY` (required)
- `LAVIYA_BASE_URL` (optional)
- `LAVIYA_AGENT_UID` (optional)
- `LAVIYA_LOG_LEVEL` (optional: `debug|info|warn|error`)

PowerShell example:

```powershell
$env:LAVIYA_API_KEY = "your-api-key"
$env:LAVIYA_BASE_URL = "https://api.laviya.app"
$env:LAVIYA_AGENT_UID = "optional-agent-uid"
$env:LAVIYA_LOG_LEVEL = "info"
```

Bash example:

```bash
export LAVIYA_API_KEY="your-api-key"
export LAVIYA_BASE_URL="https://api.laviya.app"
export LAVIYA_AGENT_UID="optional-agent-uid"
export LAVIYA_LOG_LEVEL="info"
```

## 4. Create Global Config

The runtime reads the global config from:

- Windows: `%USERPROFILE%\.laviya\config\global.json`
- macOS/Linux: `~/.laviya/config/global.json`

Use `mcp/examples/global.json` as a baseline.

PowerShell:

```powershell
New-Item -ItemType Directory -Force "$HOME\.laviya\config" | Out-Null
Copy-Item ".\examples\global.json" "$HOME\.laviya\config\global.json" -Force
```

Bash:

```bash
mkdir -p ~/.laviya/config
cp ./examples/global.json ~/.laviya/config/global.json
```

## 5. Create Project Config

Each project repository should contain one of:

- `.laviya/project.json` (recommended)
- `.laviya.json`

Minimal example (`.laviya/project.json`):

```json
{
  "projectId": 1204,
  "agentProfile": "backend-implementer",
  "pollMode": "pull"
}
```

Config discovery behavior:

- The runtime walks upward from the current working directory.
- The first matching config file is used.

## 6. Troubleshooting

- `Invalid environment configuration`: check `LAVIYA_API_KEY` and environment variable values.
- `Invalid project config`: validate `.laviya/project.json` fields and types.
- `Invalid global config`: validate the JSON shape in `~/.laviya/config/global.json`.

## 7. Quick Validation

After `npm run dev`, startup logs should include:

- `projectRoot`
- `pollMode`
- `globalConfigPath` (if global config exists)
- `projectConfigPath` (if project config exists)

Core MCP tools available in this runtime:

- `laviya_feed_task`
- `laviya_get_local_work_status`
- `laviya_cancel_local_work`
- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`

Tool outputs are API envelope JSON text: `{ HasFailed, Messages, Data }`.
