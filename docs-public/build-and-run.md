# Access Guide

## Open The Public Surface

- Public site: [https://games.dylanwlim.com](https://games.dylanwlim.com)
- Discussions: [https://github.com/dylanwlim/dylan-games-docs/discussions](https://github.com/dylanwlim/dylan-games-docs/discussions)

## Use The Current Flow

1. Open the public hub and choose Play Snake.
2. Use arrow keys or the on-screen controls to move.
3. Use New Game to restart, then browse All Games, Discover, or a genre page.

## Current Availability

The public hub is live with Snake, New Game, keyboard/on-screen controls, Discover, All Games, and genre pages.

## Source Development

The source repository is public at [https://github.com/dylanwlim/dylan-games](https://github.com/dylanwlim/dylan-games).

```bash
npm ci
npm run dev
npm run validate
```

## Automated Public Docs

The publish workflow runs on main-branch updates, manual dispatch, and a daily schedule. It refreshes `assets/homepage.png`, validates the public guide set, and publishes the files to the public docs repository.
