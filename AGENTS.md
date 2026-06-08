# Dylan Games Agent Instructions

This repo powers `games.dylanwlim.com`, a quiet browser-games hub adjacent to
`dylanwlim.com`.

## Before Edits

- Read this file, `.codex/README.md`, `README.md`, package scripts, config, and
  relevant tests before editing.
- Use `rg` with exact paths or terms before opening source files.
- Do not load build output, caches, lockfiles, media, `.vercel`, env files, or
  archived docs unless the task requires them.

## Product Boundary

- Do not modify `dylanwlim.com`.
- Do not add public links, nav items, sitemap entries, or launch copy from the
  main personal site to this hub until explicitly requested.
- Keep robots/noindex behavior intentional until public launch.

## Engineering

- Keep game metadata in `features/games/game-registry.ts`.
- Keep deterministic game rules outside React/canvas renderers.
- Keep UI components small and scoped to the launcher/game surface.
- Follow `../naming-conventions.md` for new or renamed repo-owned files while preserving route URLs and exported component names.
- Avoid backend code, secrets, and environment dependencies unless a real game
  feature requires them.

## Validation

- For production-impacting changes, run `npm run validate`.
- For targeted game-rule edits, run the relevant unit tests first, then broaden
  to `npm run validate` when launcher, config, or deployment behavior changes.
- Never claim deploy or domain readiness without a verified deployment URL or a
  stated blocker.

## Docs

- Keep `docs/current-state.md` current after repo-modifying, validation, or
  deployment passes.
- Put long history in `docs/archive` instead of growing this file.
