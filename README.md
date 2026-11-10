# Premium Camper & RV Rental Platform

A responsive web application for renting camper vans, travel trailers, and RVs across the Southeastern United States (AL, GA, FL, NC, SC, TN).

> Status: MVP built and running locally. Not deployed yet. See [`docs/PRD.md`](docs/PRD.md) for the full long-term product requirements.

## MVP — what we're building first

1. **Online booking** — customers browse the fleet, check availability, choose dates, and enter their details.
2. **Deposit payment** — secure checkout through Stripe.
3. **Customer data saved** — bookings and customer records stored in PostgreSQL, with personal data encrypted.
4. **Booking confirmation** — the customer receives a confirmation email.
5. **Owner notification** — the owner receives an email for every new paid booking.
6. **Admin page** — the owner views and manages bookings.

### Booking flow

```
Customer picks camper + dates → enters details & uploads license
  → pays deposit (Stripe) → Stripe confirms payment to our backend
  → booking saved as confirmed
  → confirmation email to customer + notification email to owner (Gmail)
```

### Planned after MVP

3D interactive camper showcase, Southeastern destination map (full-hookup RV sites), blog, rental add-ons, Services / About / FAQ pages.

## Tech Stack

Current choice, optimized for low cost (≈ $1/month + domain). **Subject to change.**

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js (React, TypeScript) + Tailwind CSS | Cloudflare (free) |
| Backend | Flask (Python) REST API + Gunicorn | Google Cloud Run (free tier) |
| Database | PostgreSQL + Flask-SQLAlchemy | Neon (free tier) |
| File storage | Private bucket for license uploads | Cloudflare R2 (free tier) |
| Payments | Stripe Checkout | Stripe (per-transaction fees) |
| Email | Gmail SMTP | Gmail (free) |
| Scheduled jobs | License data purge (30 days after return) | GitHub Actions |

## Security

- Personal data (email, phone, license) encrypted at rest; HTTPS everywhere.
- Only the admin (owner) account can view customer details.
- No card data stored — payments handled entirely by Stripe.
- Double bookings prevented at the database level.
- Uploaded licenses deleted automatically after the rental is returned.

## Design

Page structure and booking flow inspired by a car-rental template ([Driveza](https://driveza.framer.website)), visual style inspired by a mountain-cabin template ([Hemlock House](https://rentalproperty.framer.website)) — earthy palette, elegant serif headlines, mountain and lake photography. Templates are references only; the UI is built from scratch in Next.js + Tailwind.

Images: see [`docs/stock-photos.md`](docs/stock-photos.md) for the stock photo shortlist (Unsplash/Pexels, free commercial use). Camper detail pages will use real photos of our own units.

## Project Structure

```
backend/             Flask API, database models, tests
frontend/            Next.js website
docs/                PRD.md (requirements), stock-photos.md (image shortlist)
docker-compose.yml   local PostgreSQL
```

## Getting Started (local)

Prerequisites: Python 3.11+, Node.js 20+, Docker.

```bash
# 1. Database
docker compose up -d

# 2. Backend (http://localhost:5001)
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env        # then fill in SECRET_KEY and PII_ENCRYPTION_KEY (commands are in the file)
.venv/bin/flask db upgrade  # create tables
.venv/bin/flask seed        # the trailer (from seed_data.py)
.venv/bin/flask create-admin
.venv/bin/flask run

# 3. Frontend (http://localhost:3210)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Without Stripe keys, checkout is simulated and bookings confirm instantly. Without Gmail credentials, emails are skipped. Both fallbacks are disabled in production.

### Tests

```bash
cd backend && .venv/bin/python -m pytest -q
```

### Useful commands

| Command | What it does |
|---|---|
| `flask create-admin` | Create the owner login or reset its password |
| `flask seed` | Make the database match `seed_data.py`: add/update those campers, hide others |
| `flask purge-licenses` | Delete license data 30 days after a rental is completed (run daily) |
| `flask expire-pending` | Release dates held by unpaid bookings |
| `flask demo-data` | Add made-up bookings (references `DEMO-…`) to preview the owner dashboard; `--clear` removes them. Refused in production |

## Sample data

The fleet is one 2026 Keystone Montana 3795FK (`backend/app/seed_data.py`). Specs are from the dealer listing and the nightly rate is the owner's. The minimum stay, cleaning fee and security deposit are placeholders, and the photos in `frontend/public/images/montana/` are the dealer's listing photos: replace them with your own (or get written permission) before launch.
