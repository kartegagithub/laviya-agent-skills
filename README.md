# Laviya Agent Skills

This repository contains reusable orchestration assets for Laviya IDE and agent integrations.

## Main components

- `core/` shared base prompt and schema assets
- `mcp/` production-oriented TypeScript MCP runtime scaffold
- `cursor/` Cursor rule artifacts
- `claude/` Claude skill artifacts

## Runtime architecture docs

The full production architecture and implementation scaffold are documented in:

- `mcp/README.md`

This includes:

- global vs project-local config model
- MCP tool and runtime behavior design
- distribution strategy
- production readiness guidance
- concrete file scaffold and examples
