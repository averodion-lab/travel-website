# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Rental booking site for **one** luxury fifth wheel (2026 Keystone Montana 3795FK, ~40 ft, sleeps 6) in the Southeastern US. The code still supports several campers; with one, `/fleet` redirects straight to it.
Full long-term requirements live in `docs/PRD.md`. **Current priority is the MVP below** — PRD features outside it come later.

## MVP scope (build this first)

The core of the business: a customer books online, their data is saved, they get a confirmation, and the owner gets notified.

1. **Trailer page** — photo gallery, specs, floor plan and an availability calendar (`/fleet/[slug]`).
2. **Booking** — pick dates, enter customer details, upload driver's license.
3. **Payment** — Stripe Checkout for the deposit. A booking is confirmed **only** after Stripe's webhook confirms payment.
4. **Database** — campers, customers, bookings saved in PostgreSQL; PII encrypted; double bookings blocked.
5. **Emails (via Gmail)** — confirmation to the customer + new-booking notification to the owner, sent after payment is confirmed.
6. **Admin page** — owner logs in to view/manage bookings and customer details.

**Later (not MVP):** 3D camper showcase, destination map, blog, add-ons, Services/About/FAQ content pages.

## Tech stack (current decision — may change)

Chosen for near-zero cost (~$1/month + domain) while staying production-grade. The user may change parts of this later; if a change is requested, update this section and `README.md`.

| Layer | Tech | Hosting |
|---|---|---|
| Frontend | Next.js (React, TypeScript) + Tailwind CSS | Cloudflare Workers/Pages (free) |
| Backend API | Flask (Python) + Gunicorn, Dockerized | Google Cloud Run (free tier) |
| Database | PostgreSQL via Flask-SQLAlchemy + Flask-Migrate | Neon (free tier) |
| File uploads | Driver's licenses in a private bucket | Cloudflare R2 (free tier) |
| Payments | Stripe Checkout + webhooks | Stripe (per-transaction fees) |
| Email | Gmail SMTP with an app password (~500/day limit) | Gmail (free) |
| Scheduled jobs | 30-day license purge | GitHub Actions cron (free) |
| Later | Three.js (3D), Mapbox GL JS (map) | — |

Known trade-offs: Cloud Run and Neon scale to zero, so the first request after idle has a 1–3s cold start. Vercel's free plan is not used because it prohibits commercial use.

## Architecture

```
backend/                Flask API (port 5001 locally)
  app/__init__.py       app factory
  app/config.py         all settings from env vars; validate() fails fast
  app/models.py         Camper, Customer (PII), Booking (incl. park, addons snapshot, addons_total), User
  app/catalog.py        PARKS (11 campgrounds: coordinates, website, mountains/lake) and ADDONS (4-wheeler, jet ski)
  app/crypto.py         Fernet encryption for PII and license files
  app/api/              public.py (fleet, quote, bookings), webhooks.py (Stripe), admin.py
  app/services/         pricing, availability, bookings, payments, email, storage, reports (owner dashboard numbers)
  app/cli.py            flask seed | create-admin | purge-licenses | expire-pending | demo-data [--clear]
  app/seed_data.py      the Montana (real specs, $249/night; other fees are placeholders)
  migrations/           Flask-Migrate (Alembic)
  tests/                pytest, runs against real Postgres (database camper_test)
frontend/               Next.js 16 App Router + Tailwind v4 (port 3210 locally)
  app/                  / , /fleet , /fleet/[slug] , /gallery , /how-it-works , /destinations , /faq , /book , /booking/confirmation , /admin
  components/           Header, Footer, PageHero, BookCta, CamperCard, Gallery, BookingWidget, CardLogos, Reveal, CountUp, RoomTour, ParksMap (Leaflet + OpenStreetMap tiles)
  app/admin/            AdminApp (login + shell), types.tsx, views/ (Overview, Calendar, Bookings, Customers, BookingDrawer)
  lib/trailer.ts        getTrailer() for server components (first active camper)
  lib/                  api.ts (API client + types), format.ts (money, dates)
  public/images/        self-hosted stock photos (see docs/stock-photos.md)
docs/                   PRD.md, stock-photos.md
docker-compose.yml      local Postgres 16 on 127.0.0.1:5442
```

Decoupled: the frontend talks to the backend only through the REST API — no shared code, no direct DB access from Next.js.

## Commands

```bash
docker compose up -d                          # local database
cd backend && .venv/bin/flask run             # API on :5001
cd backend && .venv/bin/python -m pytest -q   # tests (need the database running)
cd backend && .venv/bin/flask db migrate -m "..." && .venv/bin/flask db upgrade
cd frontend && npm run dev                    # site on :3210
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

Ports 3000 and 3100 are used by the owner's other projects on this machine; this site uses 3210.

## How the booking flow works

1. `/fleet/[slug]`: `BookingWidget` loads booked ranges and shows a two-month calendar with month/year dropdowns. The visitor clicks a pickup day, then a return day (a return may land on another booking's pickup day). `POST /api/quote` returns the server-computed price.
2. `/book`: a stepped page (Dates → Your trip → Your details → Payment). "Your trip" picks the campground (`?park=` from the map preselects it) and switches extras on or off: a 4-wheeler at mountain parks, a jet ski at lake parks, charged per day. `POST /api/quote` and `POST /api/bookings` take `park` and `addons`; `catalog.resolve()` rejects an extra the park doesn't offer, and the server sets every price. The payment step reviews the details, shows the accepted cards and the deposit, then the form posts multipart to `POST /api/bookings`. Backend validates, encrypts PII, saves the encrypted license file, creates a **pending** booking (holds dates 35 min), returns `checkout_url`.
3. Stripe Checkout (30 min session). `POST /api/webhooks/stripe` verifies the signature and calls `confirm_booking`, which marks it **confirmed** and sends the customer + owner emails. Idempotent.
4. `/booking/confirmation?ref=...` polls `GET /api/bookings/<ref>` (no contact details in that response).
5. Owner dashboard at `/admin` (full-screen, covers the site footer): Overview (revenue, occupancy, who has the trailer, open dates), Calendar (year view by status), Bookings, Customers. Data comes from `GET /api/admin/overview` and `/api/admin/customers`. Revenue definitions are at the top of `services/reports.py`. Owner marks a booking **completed** there; `flask purge-licenses` deletes license data 30 days later.

**Development fallbacks** (refused when `APP_ENV=production`): with no `STRIPE_SECRET_KEY`, checkout is mocked and bookings confirm instantly; with no SMTP credentials, emails are skipped and only the subject is logged.

Dates are half-open `[start_date, end_date)`: a return day can be the next customer's pickup day.

## Frontend notes

- Next.js 16 with `cacheComponents: true`. Read `frontend/AGENTS.md` and the docs in `frontend/node_modules/next/dist/docs/` before changing data fetching. Rules that already bit us: server components that fetch must sit inside `<Suspense>`; `new Date()` during prerender is an error (see `DateSearch.tsx`); `params`/`searchParams` are Promises.
- The `react-hooks/set-state-in-effect` lint rule is on: derive state or set it in async callbacks, not synchronously in effects.
- Design tokens (cream/sand/ink/pine/clay, Cormorant Garamond + Montserrat) and the `.btn`, `.field`, `.label`, `.eyebrow` classes are in `app/globals.css`.
- Inner pages use `PageHero` (photo banner under the overlay header) and end with `BookCta`. Big headlines are uppercase Cormorant with a handwritten accent line (`.script`, Mrs Saint Delafield), after Hemlock House; numbered `(01)` labels and the FAQ accordion (`.faq`) are after Nordwood.
- Card brand marks (`CardLogos`) are inline SVG. Cards are entered only on Stripe's page, never in our own form.
- If a new rule in `globals.css` doesn't show up in dev, touch the file again or restart `npm run dev` (the Turbopack CSS output was seen going stale once).
- `Header` is a fixed client component (transparent over a hero with `overlay`, solid after scrolling). Anything that calls `usePathname()` must sit inside `<Suspense>` or `/fleet/[slug]` fails to prerender; that is why the nav links have their own boundary.
- Motion: `Reveal` (scroll-in), `.hero-zoom`, `.rise`, `CountUp`, `RoomTour` (auto-advancing room tabs). All respect `prefers-reduced-motion`.
- `/destinations` is the parks map: pins coloured by terrain, state filter buttons, a list where each park name links to the park's website, and "Book here" links to `/fleet?park=<slug>#book`. Data comes from `GET /api/parks`. The preview build uses the copy in `lib/preview.ts` (`PREVIEW_PARKS`), which must be kept in sync with `catalog.py`.
- Site name comes from `NEXT_PUBLIC_SITE_NAME` (frontend) and `SITE_NAME` (backend emails). Currently the placeholder `YourName`.
- No fake reviews, stats or testimonials. Add real ones when the owner supplies them.

## Data model (MVP)

- `campers`: id, name, class_type, sleeps, towing_weight_lbs, daily_rate, image_url, is_active (+ specs for detail page: dry weight, hitch, length, hookup compatibility, amenities)
- `customers` (PII): id, first_name, last_name, encrypted_email, encrypted_phone, encrypted_license_data
- `bookings`: id, camper_id, customer_id, start_date, end_date, total_price, security_deposit, status (pending/confirmed/completed/cancelled), stripe_session_id
- `users`: admin accounts (owner) with role

## Non-negotiable rules

- **Never store PII in plaintext.** Email, phone, address, and license data are encrypted at rest. Never log PII or return decrypted PII from non-admin endpoints.
- **Admin-only access to PII.** Deny by default.
- **Prevent double bookings at the database level** (PostgreSQL exclusion constraint on `camper_id` + date range), not only in application code.
- **Pricing is computed server-side.** `daily_rate * days` + fees, enforcing minimum rental periods. Never trust a price from the client. Use `Decimal`/`NUMERIC` for money, never floats.
- **Payments:** never store card data — Stripe only. Verify Stripe webhook signatures.
- **Emails are sent only after payment is confirmed** (from the Stripe webhook handler), so abandoned checkouts don't notify anyone.
- **Uploaded licenses** go to a private bucket (never public URLs) and are purged N days (default 30) after the rental is returned.
- **Secrets** (DB URL, Stripe keys, Gmail app password, encryption key) come from environment variables; never commit `.env` files.

## Conventions

- Python: type hints, app-factory pattern, blueprints per domain (campers, bookings, customers, admin, webhooks). Tests with pytest.
- Frontend: TypeScript, Tailwind, small reusable components, mobile-first responsive.
- Write tests for availability and pricing logic before implementing it.
- Keep `README.md` setup instructions current when adding commands or env vars.

## Design direction (confirmed)

Driveza-style page structure and booking flow, Hemlock House look and feel (earthy palette, serif headlines, mountain and lake photography), Aspravos ideas (3D hero, seasonal price chart) saved for later. The templates are Framer sites and paid, so they are references only; nothing is copied 1:1.

References: [Driveza](https://driveza.framer.website), [Hemlock House](https://rentalproperty.framer.website), [Aspravos](https://large-independence-620217.framer.app), [Nordwood](https://nordwood.framer.website), [Travelio](https://travelio-wbs.framer.website).

## Images

- Shortlist of ~45 free stock photos (Unsplash/Pexels — free commercial use, no attribution required) is in `docs/stock-photos.md`: trailers outdoors, Great Smoky & Blue Ridge Mountains, mountain lakes, lakeside camping, interiors.
- **Gap:** no free stock of a modern US 2-bedroom + loft bunkhouse trailer interior. Stock interiors are for lifestyle/mood sections only. Camper detail pages need the owner's **own photos** of each unit (or manufacturer photos with written permission, or paid stock).
- Before launch, download chosen images and self-host them (Next.js `<Image>`, WebP) — don't hotlink.

## Tooling

- 21st.dev skills are installed (`21st-cli-use`, `21st-ui-build`, `21st-ui-explore`, `21st-ui-review`, `21st-ai`) — use them to find/install React + Tailwind components and to review UI. Some AI features may need a 21st.dev login.
- Playwright MCP is available for browsing/screenshots. It saves files under `.playwright-mcp/` in the repo — delete that folder after use (or keep it git-ignored).

## Status

MVP built and working locally end to end (browse, pick dates, book, confirmation, admin). 38 backend tests pass; frontend lints, type-checks and builds.

**Live preview:** https://averodion-lab.github.io/travel-website/ (repo `averodion-lab/travel-website`, public, because GitHub Pages on a free account needs a public repo). Every push to `main` runs `.github/workflows/deploy.yml`, which runs `npm run build:preview` with `BASE_PATH=/travel-website` and publishes `frontend/out/` to GitHub Pages. No backend or database is online.

**Preview mode** (`NEXT_PUBLIC_BOOKING_MODE=preview`, `lib/preview.ts`): `api()` answers from a built-in copy of the trailer (keep it in sync with `seed_data.py`), the calendar shows every date open, prices are computed in the browser with the same rules as `pricing.py`, and the final Pay button shows an "online booking opens soon" screen. Nothing a visitor types leaves the browser. The owner dashboard says it isn't online yet. Static export (`NEXT_OUTPUT=export`) turns off `cacheComponents`/partial prerendering, which can't be used with `output: "export"`.

**Images:** `scripts/optimize-images.mjs` (runs before dev and every build) writes 640/1080/1920 px WebP copies to `public/_img/` (git-ignored); `lib/image-loader.ts` points `<Image>` at them, so no image server is needed. `BASE_PATH` is applied there too.

Not done yet:
1. **Accounts and deployment:** the live preview runs on GitHub Pages, but GitHub's terms don't allow Pages to be used mainly for a commercial business, so the real launch should move to Cloudflare as planned. Also needed: Stripe keys + webhook, Gmail app password + `OWNER_EMAIL`, Neon, Cloud Run, Cloudflare (frontend needs the OpenNext Cloudflare adapter), R2 for license files (`services/storage.py` is local-disk only), GitHub Actions cron for `flask purge-licenses`.
2. **Real content:** company name, the owner's own photos (`public/images/montana/` holds the Camping World listing photos as local placeholders: they are the dealer's copyright and must be replaced or licensed in writing before launch), confirm the placeholder fees in `seed_data.py` (3-night minimum, $175 cleaning, $2,000 security deposit) and the delivery/self-tow policy the copy assumes, rental terms page (the checkout checkbox mentions terms that don't exist yet), contact details.
3. **Hardening before launch:** rate limiting on `/api/admin/login` and `/api/bookings`, two-factor for admin, refund flow (cancelling in admin does not refund in Stripe), balance collection at pickup is manual.
4. **Later PRD features:** 3D showcase, destination map, add-ons, blog, About/Contact pages (Contact waits on real contact details), rental terms page.
5. The local database holds made-up bookings (references `DEMO-…`) so the dashboard has data; remove with `flask demo-data --clear`. The owner cannot yet block dates for personal use or add a booking taken by phone.
6. Unconfirmed by the owner: add-on prices ($150/day 4-wheeler, $250/day jet ski) and which parks count as mountain or lake (see `catalog.py`; Quail Creek offers neither; small park lakes like Vogel's are not treated as jet-ski lakes). The map uses OpenStreetMap's free tiles, which are meant for light use; switch to a tile provider (Mapbox is in the plan) before heavy traffic.
7. The FAQ, How It Works and Destinations copy assumes delivery and setup by the owner and a 45 ft / 50 amp site requirement; the owner has not confirmed these.
