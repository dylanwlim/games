# Production Checklist

## App

- [ ] `npm ci` completes on a clean checkout.
- [ ] `npm run validate` passes locally.
- [ ] Main hub renders on desktop and mobile.
- [ ] Snake can start, pause, reset, and lose cleanly.
- [ ] Placeholder games show finished unavailable states.
- [ ] Keyboard focus is visible and launcher controls are keyboard reachable.
- [ ] Reduced-motion preferences are respected.

## Deployment

- [ ] Vercel project is linked to this repository.
- [ ] Preview deployment succeeds.
- [ ] Production deployment succeeds.
- [ ] `games.dylanwlim.com` is attached to the Vercel project.
- [ ] DNS resolves to Vercel.
- [ ] `npm run verify:deployment -- https://games.dylanwlim.com` passes.

## Launch Boundary

- [ ] No links from `dylanwlim.com`.
- [ ] No sitemap entry on `dylanwlim.com`.
- [ ] Hub metadata and robots remain soft-launch/noindex until public launch.
