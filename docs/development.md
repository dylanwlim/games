# Development

## Prerequisites

- Node.js 24.x
- npm 10 or newer

## Setup

```bash
npm ci
npm run dev
```

The local app runs at `http://localhost:3000` by default.

## Scripts

- `npm run dev`: start the Next.js development server.
- `npm run build`: create a production build.
- `npm run start`: serve the production build locally.
- `npm run lint`: run ESLint.
- `npm run format:check`: check formatting.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run test`: run Vitest unit tests.
- `npm run test:e2e`: run Playwright smoke tests.
- `npm run validate`: run the full local validation suite.

## Game Architecture

Game rules should be deterministic and testable outside React. The starter
Snake implementation keeps movement, collision, scoring, and food placement in
`features/games/snake/snake-engine.ts`; React owns rendering, controls, local
storage, and motion.
