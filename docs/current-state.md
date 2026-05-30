# Current State

This is the repository handoff point for future Codex runs. Update it after
every implementation, cleanup, config, product, validation, or deployment pass
that changes or verifies the project.

## Latest Update

- 2026-05-30: Scaffolded and deployed Dylan Games as a production Next.js App
  Router app for `games.dylanwlim.com`. The app includes a hub-first UI,
  flexible game registry, playable Snake starter, polished unavailable-game
  states, noindex/robots soft-launch metadata, minimal local assets, security
  headers, TypeScript, ESLint, Prettier, Vitest, Playwright, GitHub Actions CI,
  Vercel config, deployment verification script, and repo-local
  agent/development docs.
- 2026-05-30: Created Vercel project `dylan-games`
  (`prj_cgKDdPzQttp7ubHyaBuYRRXVHX0m`) in team
  `team_bbLoVoshgKMbjGs5UhmJM5kZ`, added `games.dylanwlim.com`, created the
  Cloudflare DNS-only `A` record for `games` -> `76.76.21.21`, and verified the
  production domain with `npm run verify:deployment -- https://games.dylanwlim.com`.

## Current Product Boundary

- `games.dylanwlim.com` is the intended production domain.
- `dylanwlim.com` must not link to or publicly surface this hub until a future
  explicit launch task.
- The hub intentionally uses noindex/robots blocking during soft launch.

## Current Deployment

- Production: `https://games.dylanwlim.com`
- Vercel production deployment:
  `dpl_7x9McVjNta9pfSkAjz53iYYR3bzm`
  (`dylan-games-cbync7c6u-dylans-projects-73251aac.vercel.app`)
- Latest preview deployment:
  `dpl_ES6A9dUYv8Pem5NmFmQ1AWviZFYC`
  (`dylan-games-8r58gg3dm-dylans-projects-73251aac.vercel.app`)
- Direct Vercel preview URLs may require Vercel authentication because
  deployment protection is enabled; the custom production domain is publicly
  reachable and verified.
