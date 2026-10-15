# CertifiedRefurbs KE

Kenya's marketplace for certified refurbished phones, laptops and tablets. Every device is graded honestly, backed by warranty and paid for through **M-Pesa escrow**: the money is only released once the buyer confirms delivery.

| | |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, hand-built CSS design system with light/dark themes |
| **Backend** | FastAPI, SQLAlchemy 2, PostgreSQL (SQLite for quick local runs), JWT auth |
| **Payments** | Safaricom Daraja STK Push, with an offline `simulate` mode for development |

## Features

- **Shop**: search, category/brand/condition/price/storage filters, sorting, pagination, wishlist
- **Product pages**: Excellent / Good / Fair grades, each with its own price, stock and battery health
- **Cart & checkout**: delivery options, M-Pesa STK Push with live payment status
- **Escrow order tracking**: timeline, escrow status, and a "release funds" button once the order ships
- **Import for me**: landed-cost calculator (freight, KRA import duty, excise, VAT, IDF, RDL) and import requests
- **Sell / trade in**: instant trade-in quotes and pickup requests
- **Accounts**: register, sign in, order history
- **Admin dashboard**: revenue and stock stats, order status updates (processing → shipped → delivered / cancel)
- Newsletter and contact forms, SEO metadata, sitemap and robots.txt, responsive layout down to 360px

## Quick start (Docker)

```bash
docker compose up --build
```

- Storefront: http://localhost:3000
- API docs: http://localhost:8000/docs
- Admin login: `admin@certifiedrefurbs.co.ke` / `admin12345` (change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env`)

The database is created and seeded with the catalogue on first start.

## Local development

**Backend**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # defaults to SQLite if DATABASE_URL is removed
uvicorn app.main:app --reload   # http://localhost:8000
pytest                          # API tests
```

**Frontend**

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev                     # http://localhost:3000
```

If the API can't be reached, the storefront falls back to the bundled catalogue (`frontend/src/data/catalog.json`), so browsing still works. Checkout, accounts and forms need the API.

## M-Pesa

`MPESA_ENV` controls payments:

| Value | Behaviour |
|---|---|
| `simulate` (default) | No network calls. STK pushes succeed after ~6 seconds; phone numbers ending in `000` simulate a cancelled payment. |
| `sandbox` | Daraja sandbox. Set `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY` and a public `MPESA_CALLBACK_URL`. |
| `production` | Live Daraja with your own shortcode. |

Daraja posts results to `POST /api/v1/payments/mpesa/callback`. The frontend also polls `GET /api/v1/payments/{checkout_request_id}`, which queries Daraja directly, so payments complete even if the callback is delayed.

## Order & escrow lifecycle

```
pending_payment ──(M-Pesa success)──► paid [escrow: held]
   └─► processing ─► shipped ─► delivered ──(buyer confirms)──► completed [escrow: released]
any unpaid/paid state ──(admin cancels)──► cancelled [escrow: refunded if held]
```

## API overview (`/api/v1`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Catalogue | `GET /listings`, `GET /listings/{slug}`, `GET /listings/{slug}/related` |
| Orders | `POST /orders`, `GET /orders/mine`, `GET /orders/{number}?phone=`, `POST /orders/{number}/confirm-delivery` |
| Payments | `POST /payments/mpesa/stkpush`, `GET /payments/{id}`, `POST /payments/mpesa/callback` |
| Imports | `POST /imports/quote`, `POST /imports/requests` |
| Trade-ins | `POST /sell/quote`, `POST /sell/requests` |
| Site | `POST /site/newsletter`, `POST /site/contact` |
| Admin | `GET /admin/stats`, `PATCH /admin/orders/{number}` |

## Project structure

```
backend/
  app/
    api/v1/endpoints/   # route handlers
    core/               # settings & security
    db/                 # models, session, seed data
    services/           # pricing, orders/escrow, M-Pesa client, price reference scraper
  tests/
frontend/
  src/
    app/                # pages (App Router)
    components/         # header, footer, product cards, device art, providers
    lib/                # formatting, offline catalogue & calculators
    utils/api.js        # API client
docker-compose.yml
```

## Before going live

- Set a long random `SECRET_KEY` and change the admin password.
- Replace the placeholder marketing figures (stats, reviews) on the home and about pages with real numbers.
- Check the import-duty rates in `backend/app/services/pricing.py` against current KRA rates.
- Use real product photography if you have it. The device images are currently generated SVG illustrations (`components/DeviceArt.js`).
