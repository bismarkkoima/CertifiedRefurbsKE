# CertifiedRefurbs KE — Gaps & Roadmap

What's built, what's still missing before launch, and features worth adding next.
Priority: **P0** = needed before taking real money · **P1** = soon after launch · **P2** = growth.

## ✅ Shipped in the "Store" redesign

- Apple-store-style design: Store home with category icons and brand chips, carousels ("The latest", "The CertifiedRefurbs difference"), product tiles, slim translucent nav, light/dark themes.
- 113 devices across **22 brands**: Apple, Samsung, Google, Tecno, Infinix, itel, Xiaomi/Redmi, Oppo, Vivo, Realme, OnePlus, Nokia, Huawei, Honor, Motorola, Sony, HP, Dell, Lenovo, Asus, Acer, Microsoft.
- Buy page configurator: **Condition → Finish → Storage**, with each combination priced and stocked separately, plus a sticky "Add to Bag" bar. Device art changes with the chosen finish (front, back and paired views).
- Brand index and brand pages, a compare tool for up to 3 devices, a search flyout with live suggestions, and recently viewed devices.
- Genuine customer reviews: ratings are calculated only from real reviews, and buyers with a delivered order get a "Verified purchase" badge. The fake rating numbers were removed.
- Promo codes, validated at checkout and counted only when payment succeeds. Seeded: `KARIBU5`, `STUDENT2K`.
- Admin: product creation, per-variant price and stock editing, featured/deal flags, photo URLs, promo code management, review moderation (API).
- Real product photo support: set `image_url` and the photo replaces the illustration.

## 🚨 Missed — P0 (before launch)

| # | Gap | Why it matters | Suggested fix |
|---|---|---|---|
| 1 | **Holding customer funds ("escrow")** | Holding buyers' money for sellers may count as a regulated payment/escrow service under CBK rules. | Partner with a licensed escrow or payment provider, or present it as a "money-back guarantee" while funds sit in your own till. Get legal advice. |
| 2 | **KRA eTIMS e-invoicing** | Mandatory for VAT-registered businesses; every sale needs an eTIMS invoice. | Integrate the eTIMS OSCU/VSCU API at payment success; store the invoice number on the order. |
| 3 | **Data Protection Act 2019** | Collecting names, phones and addresses requires ODPC registration, a privacy policy and consent. | Register with ODPC, publish real Privacy & Terms pages, add cookie consent. |
| 4 | **Real Terms of Sale & Privacy pages** | Footer links currently point to About/Warranty. | Write the policies and create `/privacy` and `/terms`. |
| 5 | **Live M-Pesa setup** | Only the simulator has been exercised end-to-end. | Get a Daraja production shortcode and a public HTTPS callback, and test with real KSh 1 payments. |
| 6 | **Refunds & trade-in payouts** | Refunds and trade-in payments are manual today. | Use the M-Pesa **B2C** API for refunds and trade-in payouts, with an admin "Refund" button. |
| 7 | **Stock reservation** | Stock drops only after payment, so two buyers can pay for the last unit. | Reserve stock for 15 minutes when the order is placed and release it if unpaid. |
| 8 | **Per-unit inventory (IMEI/serial)** | Warranty, returns and theft checks need the exact unit that was sold. | Add a `units` table (IMEI, serial, battery %, grade, photos) and assign units to orders. |
| 9 | **Database migrations** | Schema changes currently need a database reset. | Add Alembic and generate a baseline migration. |
| 10 | **Notifications** | Customers get no confirmation outside the website. | SMS via Africa's Talking, email via Resend/SendGrid: order placed, paid, shipped, delivered. |
| 11 | **Password reset & email verification** | Locked-out users can't recover their accounts. | Add token-based reset and verification emails. |
| 12 | **Security hardening** | Logins, reviews, coupons and contact forms can be spammed or brute-forced. | Rate limiting (slowapi), CAPTCHA (Cloudflare Turnstile), httpOnly cookie sessions instead of localStorage tokens, strong `SECRET_KEY`, HTTPS-only CORS. |
| 13 | **Real photos & real stock** | The illustrations and seeded stock levels are placeholders. | Photograph each unit (or use licensed press images) and import real stock via the admin. |
| 14 | **Real business details** | The store address, phone and email are placeholders. | Replace them in the footer, contact page and pickup option. |
| 15 | **CI & monitoring** | Nothing runs tests on each push, and there's no error tracking. | GitHub Actions (pytest + lint + build), Sentry, uptime checks, daily database backups. |

## ⚠️ Missed — P1

- **Delivery by county**: courier integration (G4S, Sendy, Pickup Mtaani) with real fees per county and tracking numbers.
- **Admin order detail page**: notes, refunds, printable invoice and packing slip, CSV export.
- **Staff roles**: separate admin, stock and support permissions, plus an audit log of price and stock changes.
- **Bulk stock import** from CSV/Excel.
- **Server-side bag & favourites** for signed-in users, so they sync across devices.
- **Automatic escrow release**: if a delivered order isn't confirmed or disputed within N days, release automatically (and update the policy text to match).
- **Disputes flow**: "Report a problem" on the order page, which freezes escrow and opens a support ticket.
- **Analytics & marketing**: GA4 or Plausible, Meta/TikTok pixels, a Google Merchant Center product feed.
- **Image optimisation & performance**: `next/image` with a CDN, Lighthouse audit.
- **Accessibility audit**: keyboard focus order in the configurator and carousels, screen-reader labels.

## 💡 New feature ideas — P2

| Feature | Notes |
|---|---|
| **Lipa Mdogo Mdogo / Buy now, pay later** | Partner with Lipa Later, Aspira or Watu Credit. Big conversion driver for KSh 40k+ phones. |
| **Trade-in credit at checkout** | Apply a locked trade-in quote as a discount on a new purchase. |
| **More payment methods** | Cards and Airtel Money via Pesapal, Paystack or Flutterwave. |
| **WhatsApp Business** | Chat button, plus order updates over WhatsApp. |
| **Price-drop & back-in-stock alerts** | Email/SMS when a saved device changes price or a sold-out configuration returns. |
| **Device protection plan** | Screen and accidental-damage cover as an add-on in the bag. |
| **Accessories cross-sell** | Cases, chargers and screen protectors as a new category, suggested in the bag. |
| **Business & education orders** | Bulk quotes, LPOs, invoices, VAT receipts for SMEs and schools. |
| **Marketplace / seller accounts** | Vetted third-party refurbishers list stock; payouts after escrow release (B2C). |
| **"Ask a Specialist" chat** | Live chat or an AI shopping assistant trained on the catalogue and grading guide. |
| **Repairs & store bookings** | Book a repair, a pickup slot or a device demo at the store. |
| **Public IMEI check** | Let anyone check a phone's blacklist status (a lead magnet). |
| **Swahili language toggle** | `next-intl` with English and Kiswahili. |
| **Loyalty & referrals** | Points per purchase, KSh credit for referring friends. |
| **Gift cards** | Digital gift cards paid via M-Pesa. |
| **Buying guides / blog** | "Best phones under KSh 20,000" etc. for SEO. |
| **PWA / mobile app** | Installable web app with push notifications. |
| **360° product views & videos** | Per-unit photos and short inspection videos. |
