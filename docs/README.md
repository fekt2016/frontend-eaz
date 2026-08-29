# frontend-eaz / docs

Project documentation, moved here 2026-08-29 from the workspace root
(`/Users/mac/Desktop/eazworld/`), which is **not a git repository** — so nothing in
it was version-controlled, reviewed, or backed up. `reviewfull.md` and its dated
archive were lost from that directory during the same session, which is what
prompted the move. See **T122** in `../../backend-eaz/tasks.md`.

## Shared with `backend-eaz/docs/`

Both repos are cloned and deployed independently, so neither can reference the
other's files. These are duplicated on purpose:

| File | What it is |
|---|---|
| `monorepo-CLAUDE.md` | Project instructions for both apps (renamed so it cannot clobber this repo's own `CLAUDE.md`) |
| `monorepo-README.md` | Top-level readme (same reason) |
| `PROJECT_SPEC.md` | Product spec |
| `all-features.md` | Feature inventory |
| `howthesystemwork.md` | End-to-end narrative of how the system works |
| `roles.md` | The role matrix — this app mirrors it in `src/app/dashboard/dashboardNav.js` and `src/middleware.js`, but the backend enforces it |
| `FINAL-PRODUCTION-AUDIT.md` | Final pre-deployment audit, 2026-08-29 |

> **Duplication warning.** `roles.md` is a live document — it was edited three
> times on 2026-08-29 as role decisions were made. Two copies will drift. Treat
> the **backend** copy as canonical (it is what enforces the matrix) and pull this
> one from it, or collapse to one location.

## Frontend-only

| File | What it is |
|---|---|
| `EAZWORLD_FRONTEND_AUDIT.md` | 2026-08-25 frontend audit |
| `SEO_AUDIT.md` | SEO review |
| `STYLE_GUIDE.md` | Tailwind / design-token conventions |
| `sitemap.md` | Site structure |
| `pr-react-query-and-money-ui.md` | Pre-existing note |
