# How It Works

## Application model

Dylan Games is a Next.js App Router app. The home route renders the game hub and selects Snake by default.

## Game registry

Game metadata is centralized in the registry. Each entry defines the slug, title, genre, status, summary, description, visual accent, preview type, and priority.

Playable games render active game experiences. Planned games render unavailable-game states until their game logic is implemented.

## Game logic

Deterministic game rules should stay outside React and canvas renderers where practical. This keeps unit tests focused on rules and keeps UI code responsible for presentation and input.

## Deployment

The production target is games.dylanwlim.com on Vercel. The current app has no required environment variables.

## Search boundary

The hub intentionally uses noindex and robots blocking while it is in soft launch.
