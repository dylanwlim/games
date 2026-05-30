# Build and Run

## Requirements

- Node.js 24
- npm
- Chromium browser dependencies for Playwright end-to-end checks

## Install

```bash
npm ci
```

## Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
npm run validate
```

The validation suite checks formatting, linting, TypeScript, unit tests, production build, and Playwright smoke tests.

## Deployment commands

```bash
npm run deploy:preview
npm run deploy:production
npm run verify:deployment -- https://games.dylanwlim.com
```
