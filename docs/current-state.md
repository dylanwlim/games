# Current State

This is the repository handoff point for future Codex runs. Update it after
every implementation, cleanup, config, product, validation, or deployment pass
that changes or verifies the project.

## Latest Update

- 2026-06-09: Fixed the GameHub sidebar/header regression from the Safari
  screenshots. The sidebar brand now shows only `Dylan Games`, the sidebar
  search icon is explicitly centered inside the search input with safe left
  inset on desktop and mobile, and the hub header is fixed to the top through
  scroll extremes while preserving play-route controls. Added Playwright
  coverage for the removed subtitle, fixed header top position at scroll
  top/bottom, and search icon geometry. Validation passed targeted Prettier,
  scoped ESLint, `npm run typecheck`, `npm run test`, `npm run build`, focused
  desktop/mobile `tests/e2e/hub.spec.ts`, and Browser desktop/mobile rendered
  checks. Full `npm run validate` is currently blocked before this pass's checks
  by pre-existing Prettier failures in DWL/auth files.

- 2026-06-08: standardized internal game/source filenames without changing
  public routes, visible game names, gameplay behavior, or product copy.
  Cipherword/Cipher implementation files, Snake implementation files, the game
  hub component, the daily-answer validation script, and the root logo source
  asset now use lowercase kebab-case; imports, tests, package scripts, docs,
  and AGENTS were updated. Validation passed `npm run typecheck` and
  `npm run cipherword:validate` (8,980 unique answers, 2026-06-01 through
  2050-12-31); targeted old-path searches for renamed files returned no active
  references outside the root inventory/plan/report docs. Pre-existing
  `public/art` working-tree changes were left untouched.

- 2026-06-07: Replaced the old hover-expanded GameHub sidebar with the supplied
  `sidebar-layout.zip` shadcn-style sidebar primitives, renamed/wired them into
  repo-local `components/ui/*`, `hooks/use-mobile.ts`, `lib/utils.ts`, and the
  GameHub shell. The sidebar now uses click/rail collapse, mobile sheet
  navigation, game-specific Library/Genres groups, preserved fuzzy search,
  light/dark color tokens, and Tailwind utility generation scoped to the app.
  Verified with format, lint, typecheck, unit tests, production build,
  desktop/mobile Playwright, Browser responsive screenshots/layout checks,
  Chrome smoke/console checks, color-scheme emulation, and transition timing
  above 60 fps.
- 2026-06-02: Replaced the Dylan Games logo/favicon asset set with the supplied
  trophy logo from `dylan-games-logo-source.png`. Regenerated the Next app icon files, root
  favicon PNG/ICO files, Apple touch icon, manifest PWA icons, and bumped icon
  metadata query versions for cache refresh. Updated the date-sensitive Cipher
  daily/archive E2E to derive the current daily answer, then verified with
  `npm run validate` and a Browser metadata/asset-response check on localhost.
- 2026-06-01: Renamed the playable word game from Cipherword to Cipher across
  visible hub, game, archive, share, and test surfaces. `/games/cipher` is now
  the primary route, with `/games/cipherword` and old archive URLs redirecting
  for compatibility. The active play screen was rebuilt around the game loop:
  compact header, mode descriptions, clue strip, hidden answer tiles, seven
  persistent guess slots, best-score meaning meter, contextual one-word input,
  compact clue/progress side panel, settings disclosure, and a How it works
  modal. Verified with Browser interaction proof, desktop/phone Playwright
  viewport checks, `npm run validate`, and a clean rerun of `npm run test:e2e`.
- 2026-06-01: Reworked the games home storefront from the pasted issue list:
  the featured hero is now a Motion carousel with autoplay, pause, arrows, dots,
  progress, swipe, keyboard controls, ARIA carousel structure, and treated
  non-readable artwork; Continue Playing shows clearer Cipher/Snake resume
  state; the live grid is now Playable Games; category chips focus on useful
  playable filters; and Coming Soon uses tighter, less repetitive preview
  cards. Verified Browser desktop rendering/navigation and `npm run validate`
  across format, lint, typecheck, unit tests, build, and desktop/mobile
  Playwright.
- 2026-06-01: Reduced Snake input latency without UI changes by making the
  hook's live game snapshot update synchronously before React render catches up,
  so queued keyboard/swipe/touch moves are visible to the animation loop on the
  next frame. Verified with targeted Snake engine tests, file-level lint and
  Prettier checks, TypeScript, Browser rapid-input smoke testing on
  `/games/snake`, the Snake Playwright test in desktop/mobile Chromium, and
  `npm run validate`.
- 2026-06-01: Implemented Cipher as the second playable game across the hub.
  `/games/cipher` now supports daily, archive, unlimited, hard, and zen
  modes with local-only stats, streaks, completed puzzle state, achievements,
  share text, clue ladder, semantic warmth feedback, keyboard-friendly input,
  and responsive desktop/mobile play. `/games/cipher/archive` exposes
  past/today puzzles while keeping future cells locked, and `/games/word-forge`
  redirects to Cipher. The daily bank is sourced from the uploaded pack,
  starts on 2026-06-01 at index 0 in `America/New_York`, and validates as 8,980
  unique answers through 2050-12-31. Verified with `npm run cipherword:validate`,
  `npm run validate`, and Browser desktop/mobile spot checks.
- 2026-06-01: Remade the Snake route and site artwork around a cleaner modern
  arcade direction: compact board-aligned header, single visible status source,
  stretched right rail, simplified score/best/stats controls, in-board
  Start/Resume/Restart overlays, custom focus styling, connected canvas snake,
  glowing apple art, crash-cause Game Over copy, refreshed Snake preview art,
  and responsive mobile controls. Verified with Browser desktop/mobile checks
  and `npm run validate`.
- 2026-06-01: Finished a production pass on `/games/snake`: the engine now
  awards score with base, speed, and streak bonuses; the route has a dedicated
  local top-score component with per-mode bests; the HUD was rebuilt around a
  compact run summary; the canvas visuals were polished with smoother board,
  food, head, and wrap interpolation handling; and the animation loop now keeps
  frame-timing remainders for steadier 60 fps rendering. Verified with
  Browser desktop/mobile play checks and `npm run validate`.
- 2026-06-01: Updated sidebar search to use immediate fuzzy/category matching,
  hide unrelated storefront hero/continue content while searching, surface
  unreleased matches as disabled gray cards, and remove gray tint from opened
  sidebar nav/search hover and active states.
- 2026-06-01: Rebuilt `/games/snake` as a dedicated no-scroll play route instead
  of a hub shelf plus embedded game. The route now uses a compact play shell,
  viewport-bound Snake board, quiet HUD rail, single score/restart surface,
  Ready/Playing/Paused/Game Over overlays, sidebar-open pause/dim behavior,
  hidden game-route sidebar search, full game-genre sidebar taxonomy, and
  Playwright assertions for no library content, no route scroll, and unclipped
  board bounds.
- 2026-06-01: Upgraded Snake from the starter loop into the canonical playable
  implementation for the hub: deterministic Classic/Blitz/Zen modes, smooth
  canvas interpolation, buffered keyboard input, swipe controls, pause/restart
  states, per-mode best score and last-mode persistence, stronger unit coverage,
  and broader Playwright coverage for Snake entry points.
- 2026-06-01: Reworked only the existing sidebar motion system with
  Motion-driven collapsed/expanded width tweening, staggered label opacity/x
  reveal, fixed icon rail alignment, muted gray hover/active highlights with
  active icons kept blue, and immediate reduced-motion behavior. Verified
  desktop, tablet, and mobile sidebar behavior locally.
- 2026-06-01: Replaced the Dylan Games favicon with the updated black
  controller mark from `Updateddylan-games-logo-source.png`, renamed it into
  `public/icons/dylan-games-icon.png`, regenerated the favicon/app icon/PWA
  PNG and ICO variants with transparency, and versioned icon metadata links for
  cache refresh. Vercel preview deployment `dpl_6EYD2E61qtkERAtFE1MGDGPDzykS`
  built successfully at
  `https://dylan-games-pfs0d76td-dylans-projects-73251aac.vercel.app`.
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
  can be mirrored to `dylanwlim/games-docs` on docs changes, manual
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
- 2026-06-08: Renamed the local repo folder, GitHub repo, and Vercel project
  from `dylan-games` to `games`; renamed the public docs repo from
  `dylan-games-docs` to `games-docs`.
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
- Vercel project: `games`
  (`prj_cgKDdPzQttp7ubHyaBuYRRXVHX0m`)
- GitHub repo: `https://github.com/dylanwlim/games`
- Public docs repo: `https://github.com/dylanwlim/games-docs`
- Vercel framework preset: `Next.js`
- Direct Vercel preview URLs may require Vercel authentication because
  deployment protection is enabled; the custom production domain is publicly
  reachable and verified.
- Inspect the active production deployment id with
  `vercel inspect https://games.dylanwlim.com --scope dylans-projects-73251aac`.

## DWL Accounts Readiness

- Public sign-in/sign-up controls are now visible in the existing sidebar
  footer on desktop and inside the mobile sidebar drawer.
- `app/auth/callback/route.ts` exchanges the one-time DWL Accounts code and
  sets the `games_dwl_session` HttpOnly cookie.
- `app/api/dwl/session/route.ts` exposes the account summary. `app/api/dwl/state/route.ts`
  proxies game progress to Accounts app state under key `progress`.
- `features/games/components/dwl-game-sync.tsx` syncs existing `games:*` and
  legacy `dylan-games:*` localStorage progress keys to/from DWL Accounts. A
  fresh device reloads once after remote progress is applied so existing game
  hooks read the restored values.
- Stable DWL app id is `games`, matching the repo rename from `dylan-games` to
  `games`.
- `.env.example` documents `DWL_APP_SECRET` plus public routing variables.
- Validation for this pass: `npm run typecheck`, `npm run lint`,
  `npm run build`, and Playwright rendered checks at `127.0.0.1:3102`
  desktop/mobile with no overflow or console errors.
