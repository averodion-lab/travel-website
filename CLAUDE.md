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
  app/catalog.py        PARKS (18 campgrounds: coordinates, website, mountains/lake, delivery miles) and ADDONS (4-wheeler, jet ski); BASE, TRUCK, DELIVERY_PER_MILE (getting there)
  app/crypto.py         Fernet encryption for PII and license files
  app/api/              public.py (fleet, quote, bookings), webhooks.py (Stripe), admin.py
  app/services/         pricing, availability, bookings, payments, email, storage, reports (owner dashboard numbers)
  app/cli.py            flask seed | create-admin | purge-licenses | expire-pending | demo-data [--clear]
  app/seed_data.py      the Montana (real specs, $249/night; other fees are placeholders)
  migrations/           Flask-Migrate (Alembic)
  tests/                pytest, runs against real Postgres (database camper_test)
frontend/               Next.js 16 App Router + Tailwind v4 (port 3210 locally)
  app/                  / , /fleet , /fleet/[slug] , /book-now , /gallery , /how-it-works , /destinations , /faq , /book , /booking/confirmation , /admin
  components/           TransportPicker (own truck / rent our truck / delivery), Header, Footer, PageHero, BookCta, CamperCard, Gallery (grid | masonry | carousel), BookingWidget, CardLogos, Reveal, CountUp, ParksMap (Leaflet + OpenStreetMap tiles)
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

1. `/fleet/[slug]` (and `/fleet`): `BookingWidget` loads booked ranges and shows a two-month calendar with month/year dropdowns, plus a campground select and extras checkboxes beside it; the estimate re-prices on every change and "Book now · pay $X" goes to `/book?…&step=details`. The visitor clicks a pickup day, then a return day (a return may land on another booking's pickup day). `POST /api/quote` returns the server-computed price.
2. Booking card (`components/BookNowForm.tsx`): on the home page right under the parks map (picking a park in the map list fills it in), and on its own at `/book-now` (header "Book Now" button and the closing "Book now" buttons): one card with campground, dates (`DateRangeField`: a pop-up two-month calendar, a bottom sheet on phones) and extras as checkboxes, plus the live quote. "Book now" goes to `/book?…&addons=a,b&step=details`. Calendar rules (minimum stay, booked nights, can't run into the next booking) live in `lib/stay.ts`, shared with the trailer page calendar.
2b. `/book`: a stepped page (Dates → Your trip → Your details → Payment). "Your trip" picks the campground (`?park=` from the map preselects it) and switches extras on or off: a 4-wheeler at mountain parks, a jet ski at lake parks, charged per day. `POST /api/quote` and `POST /api/bookings` take `park` and `addons`; `catalog.resolve()` rejects an extra the park doesn't offer, and the server sets every price. "Getting there" (`transport`: `self` | `truck` | `delivery`, shown in all three booking places via `TransportPicker`): tow with your own truck (free), rent the owner's 2026 RAM 2500 Turbo Diesel (`TRUCK.daily_rate` per day; `towing_experience` must be confirmed or the server refuses), or delivery and setup at $3.50/mile × the park's `delivery_miles` × 1 (one way, drop-off only; pick-up is free). Extras ride on the trailer whoever tows it. Delivery miles are road miles from Canton/Woodstock, GA (OSRM, Nov 2026); delivery needs a campground from the list. Saved on the booking as `transport`, `transport_total`, `towing_experience`; shown in the emails and the admin drawer. **Typed places**: the campground select also has "Somewhere else: type the place" (`park=custom`). `PlacePicker` searches Photon (OpenStreetMap, search-as-you-type allowed) limited to the Southeast; the picked name + coordinates go to the server, which measures road miles from the base itself (`services/distance.py`, OSRM, `OSRM_URL`; `GET /api/distance` shows the price before dates are chosen). Refused outside the region box or beyond 400 miles. A typed place may be a private address, so it's stored encrypted (`bookings.encrypted_place`, plus `delivery_miles`); public booking responses only say "A place of your choice"; the owner sees it (with a map link) in the admin drawer and emails. In preview mode the browser measures the miles from the same OSRM server.
- **Contact**: `/contact` (`app/contact/ContactForm.tsx`) posts to `POST /api/contact`, which emails the owner with Reply-To set to the guest. Nothing is stored or logged; a hidden `website` field catches bots; 5 messages per visitor per hour (in memory). In preview mode it says the form isn't online yet. The payment step reviews the details, shows the accepted cards and the deposit, then the form posts multipart to `POST /api/bookings`. Backend validates, encrypts PII, saves the encrypted license file, creates a **pending** booking (holds dates 35 min), returns `checkout_url`.
3. Stripe Checkout (30 min session). `POST /api/webhooks/stripe` verifies the signature and calls `confirm_booking`, which marks it **confirmed** and sends the customer + owner emails. Idempotent.
4. `/booking/confirmation?ref=...` polls `GET /api/bookings/<ref>` (no contact details in that response).
5. Owner dashboard at `/admin` (full-screen, covers the site footer): Overview (revenue, occupancy, who has the trailer, open dates), Calendar (year view by status), Bookings, Customers. Data comes from `GET /api/admin/overview` and `/api/admin/customers`. Revenue definitions are at the top of `services/reports.py`. Owner marks a booking **completed** there; `flask purge-licenses` deletes license data 30 days later.

**Development fallbacks** (refused when `APP_ENV=production`): with no `STRIPE_SECRET_KEY`, checkout is mocked and bookings confirm instantly; with no SMTP credentials, emails are skipped and only the subject is logged.

Dates are half-open `[start_date, end_date)`: a return day can be the next customer's pickup day.

## Frontend notes

- Next.js 16 with `cacheComponents: true`. Read `frontend/AGENTS.md` and the docs in `frontend/node_modules/next/dist/docs/` before changing data fetching. Rules that already bit us: server components that fetch must sit inside `<Suspense>`; `new Date()` during prerender is an error (see `DateSearch.tsx`); `params`/`searchParams` are Promises.
- The `react-hooks/set-state-in-effect` lint rule is on: derive state or set it in async callbacks, not synchronously in effects.
- **Design: option E, "luxury hotel"** (chosen by the owner, Nov 2026): option A's quiet look (warm ivory `cream`, black `ink`, brass accent, still named `clay`; `pine` is a deep olive for selected states) with option C's motion. Serif headings in normal case with italic accents (no all-caps, no handwritten font: `.script` is now Cormorant italic), slim square buttons (`.btn-primary` is ink), `.lux-label` small spaced caps. Wording sells the experience: a residence delivered and prepared, "All you do is arrive." Tokens and classes are in `app/globals.css`.
- Motion lives in `components/lux/`: `InView` (adds `.in` on scroll → `.lux-rise`, `.lux-clip` unveil, `.lux-settle`, `.lux-grow`), `useScrollProgress`, `ScrollEffects` (`LitStatement` words light up, `ParallaxPhoto`, `SettlingPhotoSection`). Hero uses `.lux-slide` (3 crossfading photos), `.lux-line` (headline rises), `.lux-fade`, `.lux-shine`. All off for reduced motion.
- Home page order: hero → lit sentence → "Everything is already waiting" → numbers → `StepInside` (living-room photo grows to full screen) → residence → `Moments` ("Moments worth remembering" collage, after avenelle) → `Balance` ("Everything, in balance" circle: Comfort, Adventure, Rest, Nature; after calmco) → three steps → map + booking card → `BookCta`. Faint film grain over the whole site (`.film-grain` on `<body>`).
- Mock-ups of options A–E live in `app/design-ideas/` on the owner's machine only (not committed); `components/Treeline.tsx` is only used there now.
- Inner pages use `PageHero` (photo banner, title and italic accent rise in) and end with `BookCta` (the campfire photo: "Your stay in nature, prepared for you."). Header: links split around the centred name, "Reserve" on the right. Footer: dark, centred.
- Card brand marks (`CardLogos`) are inline SVG. Cards are entered only on Stripe's page, never in our own form.
- If a new rule in `globals.css` doesn't show up in dev, touch the file again or restart `npm run dev` (the Turbopack CSS output was seen going stale once).
- `Header` is a fixed client component (transparent over a hero with `overlay`, solid after scrolling). Anything that calls `usePathname()` must sit inside `<Suspense>` or `/fleet/[slug]` fails to prerender; that is why the nav links have their own boundary.
- `Treeline` (pine silhouettes) is no longer used on the site; the luxury design dropped it.
- Older motion helpers still used on inner pages: `Reveal`, `.hero-zoom`, `.rise`, `CountUp`. All respect `prefers-reduced-motion`.
- The parks map (`ParksMap`) is on the home page (`compact`: map only, no list; a pin's "Book the trailer here" fills the booking card below via `onPick`) and on `/destinations` (also map only, followed by a two-line summary: 4-wheeler in the mountains, jet ski by the lake). Park details live in the pin popups. `/destinations` is the parks map page: pins coloured by terrain, state filter buttons, a list where each park name links to the park's website, and "Book here" links to `/fleet?park=<slug>#book`. Data comes from `GET /api/parks`. The preview build uses the copy in `lib/preview.ts` (`PREVIEW_PARKS`), which must be kept in sync with `catalog.py`.
- `ParksMap` wraps the map in `isolate`: Leaflet's layers use z-index up to 1000 and would otherwise cover the sticky header and pop-ups. Pop-ups that must escape cards (the date picker) render into `document.body` with `createPortal`.
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

MVP built and working locally end to end (browse, pick dates, book, confirmation, admin). 73 backend tests pass; frontend lints, type-checks and builds.

**Live preview:** https://averodion-lab.github.io/travel-website/ (repo `averodion-lab/travel-website`, public, because GitHub Pages on a free account needs a public repo). Every push to `main` runs `.github/workflows/deploy.yml`, which runs `npm run build:preview` with `BASE_PATH=/travel-website` and publishes `frontend/out/` to GitHub Pages. No backend or database is online.

**Preview mode** (`NEXT_PUBLIC_BOOKING_MODE=preview`, `lib/preview.ts`): `api()` answers from a built-in copy of the trailer (keep it in sync with `seed_data.py`), the calendar shows every date open, prices are computed in the browser with the same rules as `pricing.py`, and the final Pay button shows an "online booking opens soon" screen. Nothing a visitor types leaves the browser. The owner dashboard says it isn't online yet. Static export (`NEXT_OUTPUT=export`) turns off `cacheComponents`/partial prerendering, which can't be used with `output: "export"`.

**Images:** `scripts/optimize-images.mjs` (runs before dev and every build) writes 640/1080/1920 px WebP copies to `public/_img/` (git-ignored); `lib/image-loader.ts` points `<Image>` at them, so no image server is needed. `BASE_PATH` is applied there too.

Not done yet:
1. **Accounts and deployment:** the live preview runs on GitHub Pages, but GitHub's terms don't allow Pages to be used mainly for a commercial business, so the real launch should move to Cloudflare as planned. Also needed: Stripe keys + webhook, Gmail app password + `OWNER_EMAIL`, Neon, Cloud Run, Cloudflare (frontend needs the OpenNext Cloudflare adapter), R2 for license files (`services/storage.py` is local-disk only), GitHub Actions cron for `flask purge-licenses`.
2. **Real content:** company name, the owner's own photos (`public/images/montana/` holds the Camping World listing photos as local placeholders: they are the dealer's copyright and must be replaced or licensed in writing before launch), confirm the placeholder fees in `seed_data.py` (3-night minimum, $175 cleaning, $2,000 security deposit) and the delivery/self-tow policy the copy assumes, rental terms page (the checkout checkbox mentions terms that don't exist yet), contact details.
3. **Hardening before launch:** rate limiting on `/api/admin/login` and `/api/bookings`, two-factor for admin, refund flow (cancelling in admin does not refund in Stripe), balance collection at pickup is manual.
4. **Later PRD features:** 3D showcase, destination map, add-ons, blog, About/Contact pages (Contact waits on real contact details), rental terms page.
5. The local database holds made-up bookings (references `DEMO-…`) so the dashboard has data; remove with `flask demo-data --clear`. The owner cannot yet block dates for personal use or add a booking taken by phone.
6. Unconfirmed by the owner: truck rental $175/day (placeholder, based on what heavy-duty diesel pickups rent for), add-on prices ($150/day 4-wheeler, $250/day jet ski) and which parks count as mountain or lake (see `catalog.py`; Quail Creek offers neither; small park lakes like Vogel's are not treated as jet-ski lakes). The map uses OpenStreetMap's free tiles, which are meant for light use; switch to a tile provider (Mapbox is in the plan) before heavy traffic.
7. The FAQ, How It Works and Destinations copy assumes delivery and setup by the owner and a 45 ft / 50 amp site requirement; the owner has not confirmed these.
