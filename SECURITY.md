# Security

Report security issues privately to Dylan W. Lim.

Snake play requires DWL Accounts. Keep `DWL_APP_SECRET` server-only, use the
existing `app/auth/*` and `app/api/dwl/*` bridge for account/session/state
work, and threat-model any future leaderboard, payment, or public profile
surface before implementation.
