# Kaneo Skills

This repository contains Kaneo-focused agent skills following the Agent Skills format.

## Environment and Secret Safety

The `kaneo` skill supports local env files for credentials.

Required variables:
- `KANEO_BASE_URL` (must include `/api`)
- `KANEO_TOKEN`

Resolution order:
1. Process environment
2. Workspace `.env`
3. Workspace `.env.local` (if present)

Security policy:
- Never expose token values in assistant responses, logs, command output summaries, or prompts sent to sub-agents/models.
- Never request users to paste raw tokens in chat.
- Always redact auth examples as `Authorization: Bearer ***`.

## Repository Structure

- `skills/<skill-name>/SKILL.md` - skill metadata and instructions
- `skills/<skill-name>/references/` - optional supporting docs
- `skills/<skill-name>/scripts/` - optional helper scripts

## Available Skill

| Skill | Description |
|---|---|
| `kaneo` | Manage tasks in Kaneo via REST API (tasks, labels, comments, search, project workflows). |

## Usage

Install from this repository with the Skills CLI:

```bash
npx skills add fastman/kaneo-skills
```

Install only the Kaneo skill:

```bash
npx skills add fastman/kaneo-skills --skill kaneo
```

## Claude Code Plugin Marketplace

This repository also includes plugin marketplace metadata at `.claude-plugin/marketplace.json`.

```bash
/plugin marketplace add fastman/kaneo-skills
/plugin install kaneo@<marketplace-name>
```

## Validation

Run all checks locally before publishing:

```bash
npm run validate
```

Or run checks independently:

```bash
npm run validate:plugins
npm run validate:skills
```

CI also runs these checks on every PR and push to `main` via `.github/workflows/validate.yml`.

## Versioning and Releases

- Keep `metadata.version` in `skills/kaneo/SKILL.md` up to date for behavior changes.
- Create git tags for published milestones (`vX.Y.Z`).
- Record public changes in `CHANGELOG.md`.

## Publishing to skills.sh

There is no manual deploy step to skills.sh.
Skills become discoverable/ranked via anonymous telemetry when users run:

```bash
npx skills add fastman/kaneo-skills
```

Publishing checklist is documented in `docs/PUBLISHING.md`.

## Scope Policy

- This repository is Kaneo-only.
- Keep a single skill directory: `skills/kaneo`.
- Scope checks fail CI if additional top-level skills are added.

## Maintenance Guidelines

- Keep one skill per directory under `skills/`.
- Keep `SKILL.md` focused on activation + workflow.
- Move large references to `references/` as the skill grows.
- Keep frontmatter valid (`name`, `description` required).
