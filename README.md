# Laviya Agent Skills

Laviya Agent Skills is a repository of reusable orchestration assets for IDE and agent integrations.
It provides a production-oriented MCP runtime, shared orchestration prompt assets, and client-specific
artifacts for tools such as Cursor and Claude.

## What Is Included

- `core/`: shared orchestration prompt assets
- `mcp/`: TypeScript MCP runtime scaffold (`@laviya/mcp-server`)
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

## Documentation Index

- Runtime architecture and implementation: `mcp/README.md`
- Developer setup guide: `docs/Setup.md`
- NPM publishing guide: `docs/MCPServerPublish.md`
- End-user installation and usage: `docs/InstallationAndUsage.md`

## Runtime Overview

The MCP runtime follows a global-runtime plus project-local-config model:

- machine-level runtime installation
- repository-level project configuration (`.laviya/project.json` or `.laviya.json`)
- runtime-enforced lifecycle mechanics (validation, retries, idempotency, and structured logging)

For full architecture details and file-level scaffolding, refer to `mcp/README.md`.
