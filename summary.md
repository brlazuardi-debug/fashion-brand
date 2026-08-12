# Project Summary — Dasilva Batik Storefront (Update)

**Date:** 2026-08-12
**Repository:** https://github.com/brlazuardi-debug/fashion-brand
**Pull Request:** https://github.com/brlazuardi-debug/fashion-brand/pull/1
**Branch:** `feat/sqlite-storefront` → `main`

---

## Objective

Re-architect the existing Dasilva Batik frontend prototype (which used
React-state + `localStorage` as a fake database) into a clean, layered
application backed by a **real SQLite database**, matching the
`stitch_*` / Atelier Heritage design references and the PRD v0.1, ready for a
client demo. All CRUD must work, the landing page must be responsive, nothing
should error, and unnecessary files should be removed.

---

## What Changed

### 1. Real persistence — SQLite
- Added `better-sqlite3` (native module, declared in `serverExternalPackages`).
- `src/lib/db/index.ts` — connection, schema migration, auto-seed, WAL mode.
- `src/lib/db/models.ts` — typed data-access layer; the only place SQL lives.
- DB file: `data/dasilva.db` (created + seeded on first run).

### 2. Clean backend boundary
- New JSON API under `src/app/api/**`:
  products (list/create/get/update/delete), orders (list/create), order
  status, order tracking, wishlist, auth/signin.
- `src/lib/apiClient.ts` — thin typed client wrapper.

### 3. StoreContext refactor (API-backed)
- `StoreContext` now reads/writes through `/api/*`. Its **public API was
  preserved**, so all existing pages continued to work unchanged.

### 4. Correct server rendering
- Product detail route converted to a **Server Component** that reads SQLite
  directly — correct SSR, SEO, and a real server-side 404 for unknown slugs
  (previously fell back to a non-404 loading state).

### 5. Design fidelity
- Atelier Heritage system kept intact: obsidian / paper / bronze palette,
  EB Garamond + Hanken Grotesk, 0px radius, editorial grid.
- Responsive landing verified at 375 / 768 / 1280.

### 6. Clutter removed
- Deleted 9 design-mockup folders (`*_dasilva_batik`, `atelier_heritage`,
  `collections_dasilva_batik`, etc.) and the legacy `scripts/self-check.js`
  (it validated the old localStorage approach).
- Added `.gitignore` (node_modules, .next, data, .env).

---

## Verification

- `npm run build` → compiles cleanly (12/12 pages, all API routes registered).
- Live end-to-end test (11 checks, all passing):
  - Product list / create / update / delete
  - Order create with **stock decrement**
  - Order status update + tracking number persist
  - Wishlist add / remove, demo auth
  - All pages render HTTP 200; unknown product slug → 404
- Visual check via screenshot: premium editorial landing, responsive.

---

## How to Run

```bash
npm install
npm run dev      # http://localhost:3000
# or: npm run build && npm run start
```

No env vars or external services needed. DB auto-creates + seeds on first run.

---

## Known Limitations (demo scope)

- Auth is a mock (single demo "Master Crafter" user).
- Payments are simulated (no real gateway).
- Product images still reference the original mockup asset URLs.
- No automated test suite committed (verification was run manually + via a
  throwaway script that was removed).

---

## Deliverables in this update

| File                 | Purpose                                  |
|----------------------|------------------------------------------|
| `summary.md`         | This update summary                      |
| `README.md`          | Project docs, architecture, run guide    |
| `src/lib/db/**`      | SQLite data layer                       |
| `src/app/api/**`     | JSON API routes                         |
| `src/context/...`    | API-backed store                        |
| All pages/components  | Responsive UI, CRUD wired to SQLite      |
