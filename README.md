# Dasilva Batik — Luxury Batik Storefront

A modern curation of artisanal Indonesian Batik, blending centuries of tradition
with contemporary minimalism. International luxury e-commerce demo built for
client presentation.

> **Demo scope (PRD v0.1):** Frontend showcase with full CRUD and a real
> persistence layer. Auth is a mock (single demo user) and payments are
> simulated — suitable for a client demo, not production commerce.

---

## Tech Stack

| Layer        | Choice                                            |
|--------------|---------------------------------------------------|
| Framework    | Next.js 15 (App Router) + React 19                |
| Language     | TypeScript                                        |
| Styling      | Tailwind CSS (custom Atelier Heritage design system) |
| Database     | SQLite via `better-sqlite3` (real, file-backed)   |
| Fonts        | EB Garamond (display) + Hanken Grotesk (body)     |
| Icons        | lucide-react                                      |

---

## Architecture (layered separation)

```
src/
├─ app/
│  ├─ api/                      # JSON API (backend boundary)
│  │  ├─ products/              # GET list, POST create
│  │  ├─ products/[id]/         # GET, PUT update, DELETE
│  │  ├─ orders/                # GET list, POST create (decrements stock)
│  │  ├─ orders/[id]/status/    # PATCH order status lifecycle
│  │  ├─ orders/[id]/tracking/  # PATCH international tracking number
│  │  ├─ wishlist/              # GET/POST/DELETE wishlist items
│  │  └─ auth/signin/           # demo sign-in / register
│  ├─ page.tsx                  # Landing (responsive editorial hero)
│  ├─ collections/             # Filter + sort catalog
│  ├─ product/[id]/             # Server Component → reads SQLite directly
│  │  └─ ProductDetail.tsx      # Client interactive layer
│  ├─ checkout/                 # Address, shipping, simulated payment
│  ├─ account/                  # Orders, wishlist, currency/language prefs
│  ├─ admin/                    # Dashboard + catalog/orders/inventory CRUD
│  └─ not-found.tsx
├─ components/                  # Presentational UI (Header, Footer, cards…)
├─ context/
│  └─ StoreContext.tsx          # API-backed global store (public API stable)
├─ lib/
│  ├─ db/                       # SQLite data layer (schema + models)
│  │  ├─ index.ts               # connection, schema migration, seed
│  │  └─ models.ts              # typed queries (single source of SQL)
│  ├─ apiClient.ts              # thin typed fetch wrapper
│  ├─ types.ts                  # Product, Order, User, etc.
│  ├─ currency.ts               # IDR/USD/EUR conversion
│  ├─ i18n.ts / useT.tsx        # EN/ID translations
│  └─ shipping.ts               # domestic + international shipping logic
└─ data/
   └─ initialProducts.ts        # seed catalog (used by DB layer)
```

**Data flow:** UI → `StoreContext` (stable public API) → `apiClient` →
`/api/*` routes → `lib/db/models.ts` → SQLite file (`data/dasilva.db`).

---

## Getting Started

```bash
# 1. install dependencies
npm install

# 2. run (dev)
npm run dev
# open http://localhost:3000

# or production build
npm run build && npm run start
```

The database is created automatically on first run and seeded with the
catalog from `src/data/initialProducts.ts`. No external services or env
variables are required.

### Demo credentials
- Admin dashboard: open `/admin` (auto-signs in the demo "Master Crafter" user)
- Currency toggle: IDR / USD / EUR
- Language toggle: English / Indonesian

---

## Features (PRD coverage)

- **Responsive landing page** — Atelier Heritage design, mobile-first
  (375 / 768 / 1280 breakpoints), hamburger + mobile bottom-nav.
- **Catalog (KTLG)** — collections with category filter + sort, quick-add,
  wishlist.
- **Product detail** — zoomable gallery, size selector with live stock,
  accordion (description / care / shipping), related products. Server-rendered
  with correct 404 for unknown slugs.
- **Cart & checkout (CART/SHIP/PAY)** — cart drawer, address form, domestic +
  international shipping estimate, simulated 3DS payment, fraud-status result.
- **Orders (ORD)** — created with stock decrement; lifecycle
  `awaiting_processing → processing → shipped → completed`; international
  tracking number; WhatsApp receipt link.
- **Wishlist (CUST)** — add/remove, persisted per user.
- **Account (ACCT)** — order history, wishlist, preferences.
- **Admin CRUD** — full product create/edit/delete, stock adjustments,
  order status advance, tracking entry, revenue/inventory dashboard.

---

## Scripts

| Command           | Description                          |
|-------------------|--------------------------------------|
| `npm run dev`     | Start dev server                     |
| `npm run build`   | Production build (type-checked)      |
| `npm run start`   | Serve production build               |
| `npm run lint`    | Next.js lint                         |

---

## Notes

- `node_modules/`, `.next/`, and the runtime `data/` database are gitignored.
- Auth is a mock for demo purposes — wire to a real provider (e.g. Clerk) for
  production.
- Images referenced in `initialProducts.ts` point to the original mockup asset
  URLs; swap for real product photography before launch.
