# Production Needs — the tasks still left open

This is a plain-English explanation of the items still listed as open or partially done in the
`tasks.md` files of both apps (`backend-eaz/tasks.md` and this file's repo,
`frontend-eaz/tasks.md`). The short version: **there is no code left to write in the repository.**
Every remaining task is something that can only be finished either on the production server, in
the deployment environment, with third-party login credentials, or by a human browser check.

Below, each task is explained in its own section: what the problem was, what is already done, and
exactly what is needed to finish it.

---

## Backend (`backend-eaz`)

### T3 — Test the live features that talk to external companies

**In short:** The code for 28 features that call external services (Paystack for payments,
WHM/cPanel for customer hosting, Namecheap for domain names) looks complete and is covered by
automated tests, but none of these has ever been tested against the real live services. They are
some of the most important money/operations paths in the business, so they need a real end-to-end
test to make sure they actually work "out there".

It splits into three parts:

- **T3b — Paystack (card / mobile-money payments).** The payment webhook logic is already
  verified with test data. What is missing is a deployment step, not a code change: you must open
  the Paystack dashboard, set the store's webhook URL to
  `POST /api/webhooks/paystack`, and then make a real test payment to watch the event arrive.
- **T3c — Customer hosting provisioning (WHM/cPanel).** Right now the three settings that point
  the app at the server that creates customer hosting accounts (`WHM_HOST`, `WHM_USER`,
  `WHM_TOKEN`) are all empty. As a result, when a customer pays for hosting, the system marks the
  order "skipped" and **no hosting account is ever created**. To fix: log into WHM on the
  Namecheap reseller server, create an API token, fill in those three settings, create the seven
  hosting packages, then run `npm run check:whm`, which checks everything is correct *before* a
  real customer pays.
- **T3d — Domain name search and registration (Namecheap).** Namecheap is now the chosen registrar
  and it has a safe sandbox to test in, so the whole search + register flow can be proven without
  spending real money. Two things to confirm before selling domains: that your IP is allow-listed
  on the Namecheap API key, and that the name-server "glue" records for `ns1.eazworld.co` /
  `ns2.eazworld.co` exist.

**What's left:** done in the code, needs live/third-party setup — a Paystack dashboard action,
WHM credentials + package creation, and Namecheap allow-listing. None of this can be done from
this Git repository.

---

### T85 — The app must always run in "production" mode

**In short:** How the app is started decides two security settings, and it was possible to start
it in a way that silently switched both off:

- The login cookie lost its `Secure` flag (and the strictest `SameSite` setting) —
  dangerous because the cookie could then be sent over unencrypted connections.
- The error handler started sending internal error stack traces (`err.stack`) to the browser on
  every error — leaking technical details to the public.

The fix was to make `NODE_ENV=production` take effect no matter how the app is started, and to make
the app **refuse to start** (or at least warn loudly) if the environment is ambiguous, so the two
switch-off controls can never silently turn on again.

**What's already done:** The "warn loudly at startup if the environment is ambiguous" part was
written and committed. The `ecosystem.config.js` file (the PM2 start file where the fix also
needed to go) is **not inside a Git repository** — it lives at the top-level monorepo folder that
isn't version-controlled — so that part of the change cannot be committed or pushed from here. It
was edited locally on the machine.

**What's left:** confirm the edited `ecosystem.config.js` on the live server is actually the one
in use, and that a production request contains no `stack` field and that auth cookies carry
`Secure`/`SameSite=Strict`. Server-side verification only.

---

### T96 — Background jobs must run once, not twice (and in one process)

**In short:** Originally, background jobs (renewal reminders, scheduled publishing, refund
reconciliation) ran through timers *inside* the app process, which only worked if exactly one copy
of the app was running. The app has since moved to running these jobs through the server's cron
scheduler instead, which closes that original problem.

**But two things replaced it, and one of them is a real, live risk:**
1. A setting called `IN_PROCESS_JOBS` defaults to "on" but is **not present in the live `.env`**
   file — it only exists in the example file. If the production server runs cron without also
   explicitly setting `IN_PROCESS_JOBS=false`, then **every reminder and every reconciliation would
   run twice** — the exact bug the task was originally filed about, arriving by a different door.
2. Five pieces of the app keep in-memory state (rate-limit counts, shipping/location/pickup
   caches, domain-price cache) that assume only **one** copy of the app runs. So the production
   server must be pinned to a single process.

**What's left:** on the production host — confirm `IN_PROCESS_JOBS=false` is set, and pin the
Passenger process count to `1`. This is host configuration and is **not checkable from this
repository**.

---

### T108 — The test suite sometimes fails randomly (a "flake")

**In short:** When the full backend test suite (about 100 files, run in a strict order) is run end
to end, roughly one test fails about a third of the time, and never the same test twice. The same
tests all pass perfectly when run by themselves. The failures are all connection-level oddities
(a `426 Upgrade Required`, a `socket hang up`, a `401`, a malformed-HTTP error) that never appear
where a real code bug would show up.

**What we've established:** three practical hardware theories were each ruled out with direct
measurement (file-descriptor exhaustion — no; the operating system reusing the same network port —
no; connection keep-alive reuse — no). No app code produces a `426` anywhere. The verdict reached
is that this is an order/load-dependent connection flake whose victim is essentially random and
cannot be provoked in isolation — a test-gate reliability problem rather than an application bug,
so it is no longer worth chasing in the code.

**What's shipped instead:** a one-command tool. Running `npm run test:ci` runs the full suite, then
automatically re-runs each failing test file on its own and prints **FLAKE** (green on its own,
safe) versus **FAIL** (still fails on its own, a real regression that needs investigating). A red
run now tells you in seconds whether to worry.

**What's left:** nothing in the code. The only open item is to log any newly flaked suite in the
tracker as it appears.

---

## Frontend (`frontend-eaz`)

### T97 — The website's address could silently fall back to "localhost"

**In short:** The code that builds the site's official web address (
`src/lib/seo.js`) used to default to `http://localhost:3000` if no real address was supplied. That
address feeds the SEO "canonical" tags, Open Graph / social-sharing URLs, `sitemap.xml` and
`robots.txt`. If the real address were ever missing in the live environment, every one of those
SEO tags would silently ship as `localhost:3000` — search engines would de-index or ignore the
pages and social-share previews would break, with **no error** to warn anyone.

**What's already done:** now, if the app is running in production mode and no `FRONTEND_URL` is set,
it **throws an error at build time** so the build fails loudly instead of silently shipping
localhost links. Development still works without setting anything. Verified in local builds that
the output uses the real domain everywhere with zero `localhost:3000` leftovers.

**What's left:** the deployment environment must actually supply `FRONTEND_URL`. This has to be set
in the Docker/container environment at **both** image-build time and run time, which is outside
this Git repository, and then confirmed on the live (not just local) site. Also, you must decide
the canonical host — `https://www.eazworld.co` vs the bare `https://eazworld.co` — so the choice
matches the redirect the server serves.

---

### T98 — Some public pages had no search-engine metadata

**In short:** Six public pages were reported to ship with no page title, description, canonical, or
Open Graph data, so they'd show up badly in Google and share wrong previews on social media.

**What's already done:** on checking the actual built code, 3 of the 6 were already complete
(hosting, reviews, web-design — via their layout files). Two were genuinely fixed:
- `/repair` (the device-repair booking form) — added a title and description with its own
  canonical.
- `/track-order` — added a description and its own canonical, and kept it marked
  `noindex` (it's a transactional page, so it shouldn't appear in search results at all).

The `/seo` page was deliberately left alone because it isn't a real content page — it's a tiny
redirect shim that instantly bounces visitors to `/services/seo`. Giving it marketing metadata
would be the wrong tool.

**What's left:** one manual browser check that `/seo` redirects as intended (its proper fix — a
true server-side redirect and removal from the sitemap — is tracked separately as task **T103**).
The remaining acceptance is a logged-in browser spot-check, which I can't perform.

---

### T99 — Upgrade the app framework (Next.js 14 → 16) to clear security advisories

**In short:** `npm audit` reports 21 security advisories in the `next` framework (the highest rated
8.6 — a serious one about image-optimizer and server-component handling) plus 4 in the PostCSS
library it uses. Fixing them requires upgrading the whole framework from Next.js 14 to Next.js 16 —
a major, breaking change to the framework every page of the site runs on. That's why this is
planned work rather than a casual `npm audit fix --force`.

**What's already assessed (planning only — no upgrade performed):** the migration surface has been
fully mapped. Among the concrete changes: async route params across 9 server files (this is the
highest-risk area — a hand-verified step is required), React 18 → 19, the `middleware` file being
renamed to `proxy` (which must be manually re-verified because that file is the **entire
authorization boundary** — every role's login, dashboard gating, POS access and maintenance mode),
and the lint tooling moving from `next lint` to ESLint's flat config.

An important sequencing lesson is already recorded: it is **not safe** to do the lint-tooling step
first while still on Next 14 — it was attempted and reverted, because the current lint plugin
version doesn't support the new ESLint. So the upgrade has to move in stages, with React 19 first,
then the Next 16 jump, then the middleware changes, each with quiet time and a human browser pass.

**What's left:** the actual framework upgrade (a multi-stage, multi-branch effort), and before it
can start, confirmation that the Docker base image's Node version is at least 20.9 (the Dockerfile
lives outside this repository). After the upgrade: `npm audit` clean, build/lint/tests pass, and a
**manual browser pass** by a human over login, each role's dashboard, POS access and maintenance
mode.

---

## Summary — who needs to do what

| Task | Repo | What actually needs to happen to close it | Who / where |
|---|---|---|---|
| T3b | backend | Set webhook URL in Paystack dashboard + run a sandbox payment | On Paystack, with test credentials |
| T3c | backend | Fill `WHM_HOST/USER/TOKEN`, create 7 packages, `npm run check:whm` | On the WHM server |
| T3d | backend | Allow-list Namecheap IP + verify glue records, sandbox domain order | On Namecheap |
| T85 | backend | Confirm live `ecosystem.config.js` + cookie / no-stack verification | On the production host |
| T96 | backend | Set `IN_PROCESS_JOBS=false`, pin Passenger to 1 process | On the production host |
| T108 | backend | None — tool shipped; log new flaked suites as they appear | Closed at code level |
| T97 | frontend | Set `FRONTEND_URL` in Docker env (build + runtime), pick canonical host, verify live | The deployment environment |
| T98 | frontend | Manual browser check of `/seo` redirect (+ proper /seo fix tracked as T103) | A human with a browser |
| T99 | frontend | Multi-stage framework upgrade + confirm Node ≥20.9 in Docker + post-upgrade manual browser pass | This repo + Docker + a human browser pass |

**Bottom line:** Every remaining task is finished at the code level and awaits either a deployment
environment action, a third-party account action, or a human browser check. Nothing left in these
trackers can be completed purely from the Git repositories.