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
- `claude/`: Claude skill artifacts (`SKILL.md` for orchestration, `laviya-delivery-cycle/SKILL.md` for the user-driven delivery cycle)
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

## Install the Claude Code skills

Claude Code loads a skill only from a `skills` folder, one folder per skill named after the skill, with the file named `SKILL.md`:

| Skill | Source file in this repository | Install to (personal, all projects) | Or (one project only) |
|---|---|---|---|
| `laviya-orchestrator` (orchestration runs) | `mcp/examples/claude/SKILL.md` | `~/.claude/skills/laviya-orchestrator/SKILL.md` | `<project>/.claude/skills/laviya-orchestrator/SKILL.md` |
| `laviya-delivery-cycle` (verify a work list, create tasks, report Ready for deploy) | `claude/laviya-delivery-cycle/SKILL.md` | `~/.claude/skills/laviya-delivery-cycle/SKILL.md` | `<project>/.claude/skills/laviya-delivery-cycle/SKILL.md` |

The paths in the second column are where the files live in this repository, not where Claude Code looks for them. A file in `~/.claude/laviya-delivery-cycle/` (without `skills`) or directly in `~/.claude/` is ignored.

Windows (PowerShell, from the repository root):

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills\laviya-orchestrator", "$HOME\.claude\skills\laviya-delivery-cycle" | Out-Null
Copy-Item mcp\examples\claude\SKILL.md "$HOME\.claude\skills\laviya-orchestrator\SKILL.md"
Copy-Item claude\laviya-delivery-cycle\SKILL.md "$HOME\.claude\skills\laviya-delivery-cycle\SKILL.md"
```

macOS / Linux (from the repository root):

```bash
mkdir -p ~/.claude/skills/laviya-orchestrator ~/.claude/skills/laviya-delivery-cycle
cp mcp/examples/claude/SKILL.md ~/.claude/skills/laviya-orchestrator/SKILL.md
cp claude/laviya-delivery-cycle/SKILL.md ~/.claude/skills/laviya-delivery-cycle/SKILL.md
```

Check: start a new Claude Code session and run `/skills`; `laviya-orchestrator` and `laviya-delivery-cycle` must be listed. Copy the files again after updating this repository. The Laviya MCP tools also work without the skills; the skills add the step-by-step rules.

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
- `laviya_list_projects`
- `laviya_create_tasks`
- `laviya_start_delivery_run`
- `laviya_get_task`
- `laviya_upload_task_file`
- `laviya_update_task_description`
- `laviya_assign_task`
- `laviya_start_task_work`
- `laviya_complete_task_work`
- `laviya_get_my_work`
- `laviya_start_execution`
- `laviya_complete_execution`
- `laviya_report_token_usage`
- `laviya_diagnostics`

All tools return API envelope JSON text in the shape: `{ HasFailed, Messages, Data }`.

Work items may include a backend-defined `ExecutionPolicy`. Analysis and review
policies are read-only: agents must not implement changes, and enforced policies
require a truthful completion `executionEvidence`.

For full architecture details and file-level scaffolding, refer to `mcp/README.md`.
