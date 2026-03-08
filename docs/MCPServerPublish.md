# MCP Server NPM Publishing Guide

This document explains how to publish the `mcp` package to npm in a controlled and repeatable way.

## 1. Package Requirements

Source file: `mcp/package.json`

Before publishing, confirm:

- `name`: `laviya-mcp-server` (or the final approved package name)
- `version`: valid semver (`MAJOR.MINOR.PATCH`)
- `private`: must be `false`
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

The runtime currently starts with `node dist/index.js`.  
If you want a cleaner global executable, add a `bin` entry:

```json
{
  "bin": {
    "laviya-mcp-server": "dist/index.js"
  }
}
```

If you add `bin`, validate the Node entrypoint behavior (including shebang handling) on your target platforms.

## 3. NPM Account and Scope Preparation

```bash
npm login
npm whoami
```

For scoped publishing (`@laviya/*`), confirm your account has org/team permissions.

## 4. Pre-Publish Quality Gates

Run these commands in `mcp/`:

```bash
npm ci
npm run typecheck
npm run build
npm pack --dry-run
```

Validate the package output:

- `dist/` is generated
- prompt and schema files are included
- no secrets or unnecessary files are present

## 5. Versioning

Standard patch release:

```bash
npm version patch
```

Alternative bumps:

- `npm version minor`
- `npm version major`

## 6. Publish to NPM

First public publish for a scoped package:

```bash
npm publish --access public
```

Post-publish verification:

```bash
npm view laviya-mcp-server version
npm install -g laviya-mcp-server
```

## 7. Dist-Tag Strategy (Recommended)

```bash
npm dist-tag add laviya-mcp-server@0.2.0 latest
npm dist-tag add laviya-mcp-server@0.3.0-beta.1 next
```

Typical usage:

- `latest`: stable production releases
- `next`: pre-release or staged rollout versions

## 8. Rollback and Incident Handling

Prefer deprecation over unpublishing whenever possible.

Example:

```bash
npm deprecate laviya-mcp-server@0.2.0 "Use 0.2.1 due to critical bug fix."
```

Then release a new patch version with the fix.

## 9. Release Checklist

1. Publishing settings in `package.json` are correct.
2. `npm run typecheck && npm run build` completes successfully.
3. `npm pack --dry-run` output is verified.
4. Semver is bumped with `npm version`.
5. `npm publish --access public` is executed.
6. `npm view` and global install smoke checks pass.
