# Current State

This is the repository handoff point for future Codex runs. Update it after
every implementation, cleanup, config, product, validation, or deployment pass
that changes or verifies the project.

## Latest Update

- 2026-05-31: Removed the app-level ICO route that triggered the Next dev
  favicon decoder overlay, regenerated root favicon PNG/ICO assets with alpha,
  and rechecked the hub in desktop and mobile browser viewports.
- 2026-05-31: Deployed production `dpl_6Ke3a3o3RfLEMqLktg5mfaDhctGc`
  with the new icon set, verified `games.dylanwlim.com`, and confirmed live
  favicon/manifest assets match the local generated files.
- 2026-05-31: Replaced the temporary favicon/app icon with the supplied Dylan
  Games logo across Next app icon files, root favicon variants, Apple touch
  icon, and manifest Android icon sizes.
- 2026-05-31: Reworked the games home UI into a faster hub: permanent
  collapsed/hover-expand sidebar rail, lighter top scroll blur, Snake-specific
  featured hero art and copy, compact Continue Playing, active genre filters with
  counts, a single playable All Games section, grouped coming-soon previews, no
  Game Center label, and no visible Get CTAs.
- 2026-05-31: Refined the sidebar drawer with a smaller rounded glass panel,
  top-row search, no visible drawer title, an unbadged `dylanwlim.com` footer
  link, slower Motion timing, matched search/close control colors, background
  scrolling while open, the requested white/sidebar/highlight/hover colors,
  route/sidebar/game cascade motion, and a scroll-reactive top blur.
- 2026-05-31: Added the Apple Arcade-style storefront below the genre chips,
  expanded the registry with additional coming-soon games, switched the site
  icon/favicon mark to a temporary launcher mark, added Motion-backed page/list
  animation, and verified the Vercel project framework blocker is resolved:
  project inspect now reports `Next.js` instead of `Other`/`null`.
- 2026-05-30: Updated the hub shell with a closed-by-default full-height
  sidebar drawer, removed the decorative traffic-light dots, added
  `/games/favorites`, and gave Discover plus genre routes a shared
  registry-backed collection template.
- 2026-05-30: Added the standardized `docs-public/` guide set and
  `.github/workflows/publish-public-docs.yml` so public manuals/changelog files
  can be mirrored to `dylanwlim/dylan-games-docs` on docs changes, manual
  dispatch, and the daily sync.
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
- 2026-05-30: Reworked the UI to match the supplied Apple Arcade-style
  reference: sidebar-first app shell, `Games` title, `Discover` page, genre
  pages, genre chips, screenshot-matched feature banner, `dylanwlim.com`
  profile link, generated game artwork, and a Discover parallax surface based on
  the supplied pasted component text.

## Current Product Boundary

- `games.dylanwlim.com` is the intended production domain.
- `dylanwlim.com` must not link to or publicly surface this hub until a future
  explicit launch task.
- The hub intentionally uses noindex/robots blocking during soft launch.

## Current Deployment

- Production: `https://games.dylanwlim.com`
- Vercel project: `dylan-games`
  (`prj_cgKDdPzQttp7ubHyaBuYRRXVHX0m`)
- Vercel framework preset: `Next.js`
- Direct Vercel preview URLs may require Vercel authentication because
  deployment protection is enabled; the custom production domain is publicly
  reachable and verified.
- Inspect the active production deployment id with
  `vercel inspect https://games.dylanwlim.com --scope dylans-projects-73251aac`.
