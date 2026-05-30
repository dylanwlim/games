# Deployment

## Production Target

- Vercel project: `dylan-games` (`prj_cgKDdPzQttp7ubHyaBuYRRXVHX0m`)
- Vercel team: `team_bbLoVoshgKMbjGs5UhmJM5kZ`
- Production domain: `games.dylanwlim.com`
- Main site boundary: do not modify or link from `dylanwlim.com`

## Vercel Settings

The checked-in `vercel.json` pins the expected Vercel settings:

- Framework: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Development command: `npm run dev`
- Output directory: `.next`

No environment variables are required for the current app.

## DNS

The production domain is configured in Vercel and Cloudflare with a DNS-only
record:

| Type | Name    | Value         | Proxy    |
| ---- | ------- | ------------- | -------- |
| A    | `games` | `76.76.21.21` | DNS only |

Do not add or change records for the apex `dylanwlim.com` domain for this app.

## Verification

```bash
npm run build
npm run deploy:preview
npm run deploy:production
npm run verify:deployment -- https://games.dylanwlim.com
```

The verification script checks the response, app shell content, noindex
metadata, and robots behavior.

The current verified production deployment is
`dpl_7x9McVjNta9pfSkAjz53iYYR3bzm`, aliased to
`https://games.dylanwlim.com`. The latest verified preview deployment is
`dpl_ES6A9dUYv8Pem5NmFmQ1AWviZFYC`.
