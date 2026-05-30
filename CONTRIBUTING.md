# Contributing

## Development

1. Start from a clean working tree.
2. Install with `npm ci`.
3. Run `npm run dev` for local work.
4. Keep changes narrow and update `docs/current-state.md` when repo behavior,
   deployment state, or validation state changes.
5. Run `npm run validate` before pushing production-impacting changes.

## Game Additions

- Add metadata to `features/games/game-registry.ts`.
- Keep game simulation separate from rendering.
- Add focused unit tests for deterministic game rules.
- Add or update Playwright coverage for launcher-level behavior.
- Avoid environment variables unless the game genuinely needs a backend.

## Main Site Boundary

Do not modify `dylanwlim.com` or add any public links from that site to this
hub unless the task explicitly asks for the public launch.
