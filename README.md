# Laviya Agent Skills

Laviya Agent Skills is a repository of reusable orchestration assets for IDE and agent integrations.
It provides a production-oriented MCP runtime, shared orchestration prompt assets, and client-specific
artifacts for tools such as Cursor and Claude.

## Packages

- `laviya-agent-skills`: reusable prompt, rule, and skill asset bundle for Node-based tooling
- `laviya-mcp-server`: stdio MCP runtime published from `mcp/`

## What Is Included

- `core/`: shared orchestration prompt assets
- `mcp/`: TypeScript MCP runtime scaffold (`laviya-mcp-server`)
- `cursor/`: Cursor rule artifacts
- `claude/`: Claude skill artifacts
- `docs/`: setup, npm publishing, and end-user onboarding guides

## Repository Structure

```text
laviya-agent-skills/
  core/
  mcp/
    src/
    examples/
    README.md
  cursor/
  claude/
  docs/
    Setup.md
    MCPServerPublish.md
    InstallationAndUsage.md
```

## Quick Start

```bash
cd mcp
npm install
npm run typecheck
npm run build
npm run dev
```

Required environment variable:

- `LAVIYA_API_KEY`

## Installable Asset Package

Install the reusable asset bundle:

```bash
npm install laviya-agent-skills
```

Example usage:

```js
import { assets, resolveAssetPath } from "laviya-agent-skills";
import { readFileSync } from "node:fs";

const cursorRule = readFileSync(assets.cursorRule, "utf8");
const orchestratorPrompt = readFileSync(resolveAssetPath("orchestratorSystemPrompt"), "utf8");
```

## Documentation Index

- Runtime architecture and implementation: `mcp/README.md`
- Developer setup guide: `docs/Setup.md`
- NPM publishing guide: `docs/MCPServerPublish.md`
- End-user installation and usage: `docs/InstallationAndUsage.md`
- Client-specific MCP setup (Codex, VS Code, Antigravity, Claude): `docs/InstallationAndUsage.md`

## Runtime Overview

The MCP runtime follows a global-runtime plus project-local-config model:

- machine-level runtime installation
- repository-level project configuration (`.laviya/project.json` or `.laviya.json`)
- runtime-enforced lifecycle mechanics (validation, retries, idempotency, and structured logging)

Current MCP tool set includes both orchestration and local-direct task feed flows:

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

All tools return API envelope JSON text in the shape: `{ HasFailed, Messages, Data }`.

Work items may include a backend-defined `ExecutionPolicy`. Analysis and review
policies are read-only: agents must not implement changes, and enforced policies
require matching completion `executionEvidence` and summary `policyCompliance`.

For full architecture details and file-level scaffolding, refer to `mcp/README.md`.
