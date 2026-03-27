# Changelog

All notable changes to this skills repository are documented here.

## 1.2.0 - 2026-03-27

- Added `.env` and `.env.local` credential discovery guidance for `KANEO_BASE_URL` and `KANEO_TOKEN`.
- Added strict secret-handling rules to prevent token exposure in responses, logs, command relays, and sub-agent/model prompts.
- Added safe shell setup instructions that avoid printing secrets.
- Updated repository and marketplace metadata versions to `1.2.0`.

## 1.0.1 - 2026-03-27

- Enforced Kaneo-only repository scope with `scripts/validate-scope.mjs`.
- Updated CI and local validation scripts to include scope checks.
- Updated docs and install commands to use `fastman/kaneo-skills`.

## 1.0.0 - 2026-03-27

- Initialized repository structure for `kaneo` skill.
- Added Claude plugin marketplace manifest (`.claude-plugin/marketplace.json`).
- Normalized naming to Kaneo.
- Added validation automation (GitHub Actions + local validation scripts).
