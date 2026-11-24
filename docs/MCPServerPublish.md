# MCP Server NPM + Registry Publishing Guide

This document explains the complete release flow for `mcp`:

1. Publish package to npm
2. Submit `server.json` to MCP Registry
3. Publish the remote (streamable-http) entry and request GitHub Copilot listing (sections 18-21)

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

If npm rejects direct publishing with `E_STAGE_REQUIRED`, the configured token
only permits staging. Upload the release for maintainer approval:

```bash
npm stage publish --access public
npm stage list laviya-mcp-server
npm stage view <stage-id>
```

A maintainer must approve the staged release with 2FA in the npmjs.com
**Staged Packages** tab or with `npm stage approve <stage-id>`.
Staging alone does not publish the version. Wait for approval and confirm the
live npm version before publishing `server.json` to MCP Registry.

Reference: https://docs.npmjs.com/staged-publishing/

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
.\.tools\mcp-publisher.exe status --status active io.github.kartegagithub/laviya-agent-skills <version>
```

```powershell
.\.tools\mcp-publisher.exe status --status deprecated --message "Please upgrade to newer version" io.github.kartegagithub/laviya-agent-skills <version>
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

1. `package.json`, `package-lock.json`, `src/server.ts`, `server.json`, and docs/examples are aligned.
2. `npm run typecheck && npm run build` passed.
3. `npm pack --dry-run` inspected.
4. `npm publish --access public` succeeded.
5. `npm view laviya-mcp-server version` matches release version.
6. `.\.tools\mcp-publisher.exe publish .\server.json` succeeded.


## 18. Registry Entries Overview

Laviya has two separate entries in the official MCP Registry (`https://registry.modelcontextprotocol.io`).
They are intentionally **not** merged into one `server.json`: the tool sets and authentication differ,
and `packages` + `remotes` in one entry must expose the same server.

| Registry name | Transport | Auth | `server.json` | Purpose |
| --- | --- | --- | --- | --- |
| `io.github.kartegagithub/laviya-agent-skills` | stdio (npm `laviya-mcp-server`) | `LAVIYA_API_KEY` | `mcp/server.json` | Agent orchestration runtime |
| `io.github.kartegagithub/laviya` | streamable-http `https://api.laviya.app/api/mcp` | OAuth 2.1 + PKCE + dynamic client registration | `mcp-remote/server.json` | Workspace access: tasks, wikis, sprints, test cases |

Both names are under the `io.github.kartegagithub/` namespace, so the same GitHub login (section 11) can publish both.
The remote entry was first published as `1.0.0` on 2026-11-10.

## 19. Publish the Remote (streamable-http) Entry

The remote entry has no npm package. Only `mcp-remote/server.json` is published; the server itself is the
deployed Laviya backend, so backend releases do **not** require a registry publish.

Publish again only when metadata changes (URL, description, title, website). Bump `version` first
(for example `1.0.0` → `1.0.1`); the registry rejects an already-published version.

Run in `mcp/` (PowerShell):

```powershell
$githubToken = (Get-Content -Path ".\.mcpregistry_github_token" -Raw).Trim()
.\.tools\mcp-publisher.exe login github -token $githubToken
.\.tools\mcp-publisher.exe validate ..\mcp-remote\server.json
.\.tools\mcp-publisher.exe publish ..\mcp-remote\server.json
```

Verify:

```powershell
curl.exe "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.kartegagithub/laviya"
```

The response must contain `"name":"io.github.kartegagithub/laviya"`, the new `version`, and `"isLatest":true`.

Before publishing a URL change, test the endpoint in VS Code with `.vscode/mcp.json`:

```json
{
  "servers": {
    "laviya": { "type": "http", "url": "https://api.laviya.app/api/mcp" }
  }
}
```

OAuth requirements that clients (VS Code / Copilot, Claude, Codex) rely on:

- `POST /api/mcp` without a token returns `401` with `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource/api/mcp"`.
- `/.well-known/oauth-authorization-server` advertises `registration_endpoint` (dynamic client registration).
- Redirect URIs: any `https` URL, or `http` on loopback (`localhost`, `127.0.0.1`, `[::1]`) with any port.
  VS Code uses loopback ports and `https://vscode.dev/redirect`.

## 20. GitHub Copilot MCP Registry Listing

GitHub's MCP Registry (`https://github.com/mcp`, used by Copilot / VS Code) is fed from the official MCP Registry,
but it does **not** list every published server automatically. After publishing (sections 12 and 19):

1. Email `partnerships@github.com` and nominate both registry names, remote entry first:
   - `io.github.kartegagithub/laviya` (remote, OAuth)
   - `io.github.kartegagithub/laviya-agent-skills` (stdio agent runtime)
2. Once listed, new registry versions flow to GitHub automatically.

Check listing status:

```powershell
curl.exe "https://api.mcp.github.com/v0.1/servers?search=laviya"
```

`"count":0` means the server is not listed on GitHub yet (state as of 2026-11-10).

## 21. Troubleshooting

- `401 … token is expired` on publish: the registry JWT is short-lived. Run the login step again, then publish.
- `You do not have permission to publish this server`: the GitHub account behind the PAT must be a member of
  `kartegagithub`. Make the organization membership public, then log in again.
- `validate` works with `mcp-publisher` 1.5.0 (the binary in `.tools`); the note in section 15 applies only to older builds.
