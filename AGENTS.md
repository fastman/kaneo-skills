# AGENTS.md — Kaneo Skills Repository

This repository contains Kaneo agent skills following the Agent Skills format. It is NOT a typical application — there is no build, test framework, or linting. Only validation scripts exist.

## Commands

```bash
# Run all validations (scope, marketplace, skill spec)
npm run validate

# Run validations individually
npm run validate:scope    # Verifies only skills/kaneo exists (Kaneo-only policy)
npm run validate:plugins # Validates .claude-plugin/marketplace.json
npm run validate:skills  # Validates skill spec with npx skills-ref
```

No other commands available. This is a skill package, not an application.

## Code Style Guidelines

### General Principles

- Keep code minimal and concise — these are small validation scripts
- Use ES modules (`import`/`export`, not CommonJS `require`)
- Use async/await over raw promises
- Use `node:` prefix for built-in modules: `import { readFile } from 'node:fs/promises'`

### File Conventions

- Validation scripts: `.mjs` extension (ESM)
- Place in `scripts/` directory
- Use `#!/usr/bin/env node` shebang if executable

### Error Handling

- Use try/catch blocks for async operations
- Exit with `process.exit(1)` on failure
- Print meaningful error messages to stderr
- Exit with code 0 on success

Example:
```javascript
async function main() {
  try {
    await doSomething();
  } catch (err) {
    console.error(`Validation failed: ${err.message}`);
    process.exit(1);
  }
}
main();
```

### Imports

```javascript
import { promises as fs } from 'node:fs';
import path from 'node:path';
```

## Repository Structure

```
├── skills/kaneo/SKILL.md    # Main skill definition (REQUIRED)
├── skills/kaneo/references/ # Optional supporting docs
├── scripts/                 # Validation scripts (.mjs)
├── .claude-plugin/          # Marketplace manifest
└── docs/                    # Documentation
```

## Kaneo Skill Requirements

When working with the Kaneo skill (`skills/kaneo/SKILL.md`):

### MCP Configuration

The Kaneo skill uses `mcp-kaneo` MCP server. No direct env handling needed.

MCP config files:
- `.mcp.json` — Claude Code
- `.opencode/mcp.json` — OpenCode

### Secret Handling (STRICT)

`KANEO_TOKEN` is secret and must NEVER be exposed.

**Forbidden:**
- Printing token values in output
- Including tokens in logs, errors, or markdown examples
- Sending tokens in prompts to sub-agents

**Allowed:**
- Reference variable names only: `KANEO_TOKEN`
- Use redaction: `Authorization: Bearer ***`

### SKILL.md Frontmatter

Required fields:
```yaml
---
name: <skill-name>
description: <description>
license: MIT
compatibility: opencode
metadata:
  audience: developers
  topic: <topic>
  api: kaneo
  version: X.Y.Z
---
```

### Label Registry

When using the Kaneo skill in a project:
- Read `docs/LABELS.md` at session start (if exists)
- Create it if missing using the template in SKILL.md
- Keep it synced after any label operations

## Scope Policy

This repository is Kaneo-only. Only `skills/kaneo/` is allowed. Adding other skill directories will fail CI validation.

## Versioning

- Update `metadata.version` in `skills/kaneo/SKILL.md` for behavior changes
- Create git tags: `vX.Y.Z`
- Document changes in `CHANGELOG.md`

## Common Tasks

### Running validation before committing
```bash
npm run validate
```

### Updating skill version
Edit `version` in SKILL.md frontmatter AND `skills/kaneo/SKILL.md` metadata section.

### Creating a new skill (NOT ALLOWED)
This repo is Kaneo-only. Do not add other skills.

## References

- Full API documentation: `skills/kaneo/SKILL.md`
- Publishing guide: `docs/PUBLISHING.md`
- README: `README.md`
