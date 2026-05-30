# Codex Notes

Use this file as the repo-local Codex orientation after `AGENTS.md`.

## Current Shape

- App Router pages live in `app/`.
- Shared app constants live in `lib/`.
- Game registry and feature code live in `features/games/`.
- E2E tests live in `tests/e2e/`.
- Deployment and verification scripts live in `scripts/`.

## Default Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Use `npm run validate` for the complete local gate.

## Vercel

The intended production project is `dylan-games`, serving
`games.dylanwlim.com`. The app currently has no required environment variables.
