# MCP Server NPM + Registry Publishing Guide

This document explains the complete release flow for `mcp`:

1. Publish package to npm
2. Submit `server.json` to MCP Registry

The goal is to keep all commands in one place so you do not need to search in future releases.

## 1. Package Requirements

Source file: `mcp/package.json`

Before publishing, confirm:

- `name`: `laviya-mcp-server`
- `version`: valid semver (`MAJOR.MINOR.PATCH`)
- `private`: `false`
- `files`: includes publish artifacts (`dist`, `src/prompts`, `src/schemas`, `examples`, `README.md`)

Recommended publishing block:

```json
{
  "private": false,
  "publishConfig": {
    "access": "public"
  }
}
```

## 2. Optional CLI Entry (`bin`)

The runtime starts with `node dist/index.js`.
If you want a cleaner global executable, use:

```json
{
  "bin": {
    "laviya-mcp-server": "dist/index.js"
  }
}
```

## 3. NPM Account Preparation

```bash
npm login
npm whoami
```

## 4. Pre-Publish Quality Gates

Run these commands in `mcp/`:

```bash
npm ci
npm run typecheck
npm run build
npm pack --dry-run
```

Validate:

- `dist/` is generated
- prompt and schema files are included
- no secrets or unnecessary files are included

## 5. Versioning

Standard patch release:

```bash
npm version patch
```

Alternative bumps:

- `npm version minor`
- `npm version major`

If git tags are managed separately:

```bash
npm version patch --no-git-tag-version
```

## 6. Publish to NPM

```bash
npm publish --access public
```

Post-publish verification:

```bash
npm view laviya-mcp-server version
npm install -g laviya-mcp-server
```

## 7. Dist-Tag Strategy (Optional)

```bash
npm dist-tag add laviya-mcp-server@0.2.0 latest
npm dist-tag add laviya-mcp-server@0.3.0-beta.1 next
```

Typical usage:

- `latest`: stable production releases
- `next`: pre-release versions

## 8. Rollback and Incident Handling

Prefer deprecation over unpublishing.

Example:

```bash
npm deprecate laviya-mcp-server@0.2.0 "Use 0.2.1 due to critical bug fix."
```

## 9. MCP Registry Publisher Binary Location

Use this fixed path from now on:

- `mcp/.tools/mcp-publisher.exe`

Token files used in this repo:

- `mcp/.mcpregistry_github_token` (GitHub PAT content only)
- `mcp/.mcpregistry_registry_token` (registry auth output; generated/updated by CLI)

## 10. Install or Update `mcp-publisher.exe` to `.tools`

Run in `mcp/` (PowerShell):

```powershell
$arch = if ([System.Runtime.InteropServices.RuntimeInformation]::ProcessArchitecture -eq "Arm64") { "arm64" } else { "amd64" }
New-Item -ItemType Directory -Path ".\.tools" -Force | Out-Null
Invoke-WebRequest -Uri "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_windows_$arch.tar.gz" -OutFile ".\.tools\mcp-publisher.tar.gz"
tar xf ".\.tools\mcp-publisher.tar.gz" -C ".\.tools" "mcp-publisher.exe"
Remove-Item ".\.tools\mcp-publisher.tar.gz" -Force
.\.tools\mcp-publisher.exe --help
```

## 11. Login to MCP Registry

Run in `mcp/`:

```powershell
$githubToken = (Get-Content -Path ".\.mcpregistry_github_token" -Raw).Trim()
.\.tools\mcp-publisher.exe login github -token $githubToken
```

Optional custom registry endpoint:

```powershell
.\.tools\mcp-publisher.exe login github -token $githubToken -registry "https://registry.modelcontextprotocol.io"
```

## 12. Publish `server.json` to MCP Registry

Run in `mcp/`:

```powershell
.\.tools\mcp-publisher.exe publish .\server.json
```

Expected success output pattern:

- `Successfully published`
- `Server <name> version <version>`

## 13. Update Registry Status (Optional)

Examples:

```powershell
.\.tools\mcp-publisher.exe status --status active io.github.kartegagithub/laviya-agent-skills 0.1.13
```

```powershell
.\.tools\mcp-publisher.exe status --status deprecated --message "Please upgrade to newer version" io.github.kartegagithub/laviya-agent-skills 0.1.13
```

```powershell
.\.tools\mcp-publisher.exe status --status deprecated --all-versions --message "Project archived" io.github.kartegagithub/laviya-agent-skills
```

## 14. Logout (Optional)

```powershell
.\.tools\mcp-publisher.exe logout
```

## 15. Known CLI Note

Some `mcp-publisher` builds display `validate` in help text but do not execute it (`Unknown command: validate`).
Do not block release flow on `validate` unless your installed binary supports it.

## 16. One-Pass Release Runbook (No Search Needed)

Run in `mcp/`:

```powershell
# 1) Quality gates
npm ci
npm run typecheck
npm run build
npm pack --dry-run

# 2) Version bump
npm version patch --no-git-tag-version

# 3) Rebuild after version bump
npm run build

# 4) Publish npm
npm publish --access public
npm view laviya-mcp-server version

# 5) Registry login + publish
$githubToken = (Get-Content -Path ".\.mcpregistry_github_token" -Raw).Trim()
.\.tools\mcp-publisher.exe login github -token $githubToken
.\.tools\mcp-publisher.exe publish .\server.json
```

## 17. Release Checklist

1. `package.json`, `package-lock.json`, `src/server.ts`, `server.json`, and docs versions are aligned.
2. `npm run typecheck && npm run build` passed.
3. `npm pack --dry-run` inspected.
4. `npm publish --access public` succeeded.
5. `npm view laviya-mcp-server version` matches release version.
6. `.\.tools\mcp-publisher.exe publish .\server.json` succeeded.

