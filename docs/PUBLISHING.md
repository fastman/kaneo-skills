# Publishing Plan (skills.sh)

This repository is published through normal GitHub hosting. There is no separate skills.sh deployment pipeline.

## How listing works

- `skills.sh` discovers and ranks skills using anonymous `skills` CLI install telemetry.
- Your repository appears as users install it with `npx skills add`.

## Preconditions

1. Repository is public on GitHub.
2. `skills/kaneo/SKILL.md` is valid and uses stable naming.
3. `.claude-plugin/marketplace.json` is valid and points to existing skill paths.
4. CI passes (`.github/workflows/validate.yml`).

## Local preflight

Run before every release:

```bash
npm run validate
```

## Release process

1. Update `skills/kaneo/SKILL.md` `metadata.version`.
2. Add entry to `CHANGELOG.md`.
3. Merge to `main` after CI passes.
4. Tag release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

5. Announce install command:

```bash
npx skills add fastman/kaneo-skills
```

## Optional hardening (future)

- Add markdown lint/spellcheck workflow.
- Add semver/check script to ensure changelog and skill metadata stay aligned.

## Repository scope

- This repository is intentionally Kaneo-only.
- Keep skill content under `skills/kaneo`.
