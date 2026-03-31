# Pisazo — Apartment Price Tracker for A Coruña

## Vision

A Nuxt-based web app that tracks apartment prices in a specific area of A Coruña by combining **Idealista listing data** (asking prices) with **Notariado real transaction data** (actual sale prices). Data is collected daily and persisted in a free cloud database, providing a clear picture of the real estate market over time.

---

## Data Sources

### 1. Idealista (Asking Prices)

**Official API** — `https://api.idealista.com/3.5/es/search`

- Access must be requested at [developers.idealista.com](https://developers.idealista.com/access-request). Manually reviewed — may take days/weeks.
- OAuth2 Client Credentials flow (apikey + secret → Bearer token).
- Search endpoint supports geo-based queries (`center` lat/lng + `distance` radius), filtering by `propertyType: homes`, `operation: sale`, price range, size, bedrooms, etc.
- Returns: price, address, coordinates, sqm, rooms, bathrooms, photos, listing date, agency info.
- **Limitations:** ~100 requests/month on the free tier (unconfirmed exact quota). No price history or individual property detail endpoint.
- **No built-in "delisted" detection** — we infer it by absence from subsequent searches.

**Fallback / Alternative:** If the official API is too restrictive:
- **Apify Idealista scraper** (~$0.50/1K results) — most flexible.
- **Piloterr** — 50 free requests, then paid.
- **Direct scraping** with Playwright (fragile, against ToS, last resort).

**Strategy:**
1. Apply for the official API immediately (it's free).
2. Build the integration against the official API.
3. If quota is insufficient, swap to Apify or Piloterr behind the same interface.

### 2. Portal Estadístico del Notariado (Real Transaction Prices)

**Source:** [penotariado.com](https://www.penotariado.com) — launched October 2025 by Consejo General del Notariado.

- Data from actual notarized purchase deeds (not asking prices).
- Available metrics: avg price/m², avg total price, avg surface area, number of transactions, buyer demographics.
- Granularity: national → autonomous community → province → municipality → **postal code** → custom drawn area.
- Updated **monthly** with a **2-3 month lag**.
- **No public API.** It's a Next.js SPA — data extraction requires reverse-engineering internal API calls or browser automation.
- PDF export available (5 free queries/month for registered users).

**Alternative portal:** The older **CIEN** at `notariado.org/liferay/web/cien/estadisticas-al-completo` supports **CSV/Excel export** with municipal-level data — better for automated ingestion.

**Strategy:**
1. Start with the **CIEN portal** (CSV/Excel exports) for historical and monthly bulk data.
2. Reverse-engineer penotariado.com's internal API using browser DevTools (likely REST/GraphQL endpoints that feed the Next.js frontend). Build a scraper against those endpoints.
3. If internal API is too fragile, fall back to monthly manual CSV download from CIEN + automated ingestion pipeline.

---

## Architecture

### Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | **Nuxt 4** | SSR on Netlify, following republica/electricmagic patterns |
| Styling | **Tailwind CSS 3** | `u-` prefix, custom design tokens |
| Database | **Turso (libSQL)** | Free tier: 500 DBs, 9 GB, 500M reads/mo |
| ORM | **Drizzle ORM** | Type-safe, lightweight, great Turso support |
| Cron Jobs | **GitHub Actions** (scheduled) | Daily data collection, free for public repos |
| Charts | **Chart.js** or **Apache ECharts** | Price trend visualization |
| Deployment | **Netlify** | SSR with Nitro, matching existing projects |

### Why Turso?

- Generous free tier (9 GB storage, 500M reads/month) — our dataset will be <100 MB.
- No auto-pause (unlike Supabase which pauses after 7 days inactivity).
- SQLite-based — simple, familiar, great for time-series-like queries.
- No credit card required.
- If we ever need full Postgres (window functions, CTEs), **Neon** is the backup (0.5 GB free, serverless scale-to-zero).

---

## Data Model

```sql
-- Areas we're tracking
CREATE TABLE zones (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,          -- e.g. "Eirís", "Centro", "Monte Alto"
  postal_code TEXT,
  lat       REAL,
  lng       REAL,
  radius_m  INTEGER                 -- search radius for Idealista
);

-- Individual Idealista listings
CREATE TABLE listings (
  id              TEXT PRIMARY KEY,  -- Idealista property code
  zone_id         INTEGER REFERENCES zones(id),
  address         TEXT,
  lat             REAL,
  lng             REAL,
  property_type   TEXT,              -- flat, house, penthouse, studio...
  bedrooms        INTEGER,
  bathrooms       INTEGER,
  size_m2         REAL,
  floor           TEXT,
  has_elevator    BOOLEAN,
  has_terrace     BOOLEAN,
  has_garage      BOOLEAN,
  agency          TEXT,
  first_seen      TEXT,              -- ISO date
  last_seen       TEXT,              -- ISO date
  status          TEXT DEFAULT 'active' -- active, delisted, sold(inferred)
);

-- Daily price snapshots for each listing
CREATE TABLE price_snapshots (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id  TEXT REFERENCES listings(id),
  date        TEXT NOT NULL,         -- ISO date
  price       INTEGER,               -- asking price in EUR
  price_m2    REAL,                  -- price per sqm
  UNIQUE(listing_id, date)
);

-- Notariado aggregate data (monthly)
CREATE TABLE notariado_stats (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id         INTEGER REFERENCES zones(id),
  month           TEXT NOT NULL,      -- YYYY-MM
  avg_price_m2    REAL,
  avg_total_price REAL,
  avg_surface_m2  REAL,
  num_transactions INTEGER,
  pct_foreign_buyers REAL,
  UNIQUE(zone_id, month)
);

-- Derived insights
CREATE TABLE market_metrics (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  zone_id         INTEGER REFERENCES zones(id),
  date            TEXT NOT NULL,
  median_asking_price     INTEGER,
  avg_asking_price_m2     REAL,
  num_active_listings     INTEGER,
  num_new_listings        INTEGER,  -- new today
  num_delisted            INTEGER,  -- disappeared today
  avg_days_on_market      REAL,
  asking_vs_notariado_gap REAL,     -- % difference asking vs real
  UNIQUE(zone_id, date)
);
```

---

## Daily Data Collection Pipeline

Runs as a **GitHub Actions cron job** (e.g. `0 8 * * *` — 8 AM UTC daily).

```
┌─────────────────────────────────────────────┐
│           GitHub Actions (cron)              │
├─────────────────────────────────────────────┤
│                                             │
│  1. Fetch Idealista listings for each zone  │
│     - Search API with lat/lng + radius      │
│     - Compare with existing listings        │
│     - Insert new listings                   │
│     - Update last_seen for active           │
│     - Mark delisted (not in results)        │
│     - Insert price_snapshot for each        │
│                                             │
│  2. Fetch Notariado data (monthly check)    │
│     - If new month data available           │
│     - Download CSV from CIEN or             │
│       scrape penotariado.com                │
│     - Insert into notariado_stats           │
│                                             │
│  3. Compute market_metrics                  │
│     - Aggregate today's listing data        │
│     - Calculate gap vs notariado            │
│                                             │
│  4. Trigger Netlify rebuild (optional)      │
│     - If we want ISR, skip this             │
│                                             │
└─────────────────────────────────────────────┘
```

**Implementation:** A Node.js script (`scripts/collect.ts`) that:
- Uses `@libsql/client` to connect to Turso.
- Uses `fetch` to call the Idealista API.
- Handles pagination (maxItems per page).
- Is idempotent (safe to re-run).

---

## Frontend Pages

### `/` — Dashboard
- Map of A Coruña with tracked zones highlighted.
- Summary cards: avg price/m², total active listings, monthly trend arrow.
- Quick comparison: Idealista asking vs Notariado real prices.

### `/zones/[slug]` — Zone Detail
- **Price trend chart** — daily asking price (line) with monthly notariado overlay (bar/area).
- **Active listings table** — sortable by price, size, days on market.
- **Price distribution** — histogram of current prices.
- **Asking vs Real gap** — how far above/below notariado are listings priced.

### `/listings/[id]` — Listing Detail
- Price history chart for this specific listing.
- Days on market, price drops highlighted.
- Property details (bedrooms, size, features).
- Link to Idealista original listing.

### `/insights` — Market Analysis
- Overall trends across all zones.
- Time to sell (inferred from delisting).
- Price drop frequency and magnitude.
- Seasonal patterns.

---

## Project Structure

```
pisazo/
├── app/
│   ├── assets/
│   │   └── css/
│   │       └── main.css             # ITCSS layers + Tailwind
│   ├── components/
│   │   ├── Chart/
│   │   │   ├── PriceTrend.vue       # Line chart component
│   │   │   ├── PriceDistribution.vue
│   │   │   └── AskingVsReal.vue
│   │   ├── Map/
│   │   │   ├── ZoneMap.vue          # Leaflet map with zones
│   │   │   └── ListingMarker.vue
│   │   ├── Listing/
│   │   │   ├── Card.vue
│   │   │   └── Table.vue
│   │   └── Dashboard/
│   │       ├── SummaryCard.vue
│   │       └── TrendArrow.vue
│   ├── composables/
│   │   ├── useZones.ts
│   │   ├── useListings.ts
│   │   ├── useMarketMetrics.ts
│   │   └── useNotariado.ts
│   ├── pages/
│   │   ├── index.vue                # Dashboard
│   │   ├── zones/
│   │   │   └── [slug].vue           # Zone detail
│   │   ├── listings/
│   │   │   └── [id].vue             # Listing detail
│   │   └── insights.vue             # Market analysis
│   ├── types/
│   │   ├── listing.ts
│   │   ├── zone.ts
│   │   └── market.ts
│   └── app.vue
├── server/
│   ├── api/
│   │   ├── zones/
│   │   │   ├── index.get.ts         # List zones
│   │   │   └── [slug].get.ts        # Zone detail + metrics
│   │   ├── listings/
│   │   │   ├── index.get.ts         # List listings (filterable)
│   │   │   └── [id].get.ts          # Listing + price history
│   │   ├── metrics/
│   │   │   └── [zone].get.ts        # Market metrics time series
│   │   └── notariado/
│   │       └── [zone].get.ts        # Notariado stats
│   ├── utils/
│   │   └── db.ts                    # Turso client singleton
│   └── database/
│       ├── schema.ts                # Drizzle schema definitions
│       └── migrations/              # Drizzle migrations
├── scripts/
│   ├── collect.ts                   # Daily data collection
│   ├── collect-idealista.ts         # Idealista-specific logic
│   ├── collect-notariado.ts         # Notariado-specific logic
│   └── seed-zones.ts               # Initial zone setup
├── .github/
│   └── workflows/
│       └── collect.yml              # Daily cron job
├── nuxt.config.ts
├── tailwind.config.js
├── drizzle.config.ts
├── package.json
├── netlify.toml
└── .env.example
```

---

## Implementation Phases

### Phase 1 — Foundation (Week 1)
1. Init Nuxt 4 project with Tailwind (`u-` prefix), matching republica/electricmagic config.
2. Set up Turso database + Drizzle ORM with the schema above.
3. Create `scripts/seed-zones.ts` to define the A Coruña zones to track.
4. Build `server/utils/db.ts` — Turso connection singleton.
5. Apply for Idealista API access.

### Phase 2 — Data Collection (Week 2)
1. Build Idealista integration (`scripts/collect-idealista.ts`).
2. Build Notariado integration (`scripts/collect-notariado.ts`) — start with CIEN CSV.
3. Build the daily collection orchestrator (`scripts/collect.ts`).
4. Set up GitHub Actions cron workflow.
5. Run first data collection, verify data in Turso dashboard.

### Phase 3 — API & Frontend (Week 3)
1. Build Nuxt server API routes (zones, listings, metrics, notariado).
2. Build the dashboard page with summary cards and zone map (Leaflet).
3. Build zone detail page with price trend chart.
4. Build listing detail page with price history.

### Phase 4 — Insights & Polish (Week 4)
1. Build the insights page with cross-zone analysis.
2. Add asking-vs-real price gap visualization.
3. SEO: sitemap, meta tags, OG images.
4. Deploy to Netlify.
5. Reverse-engineer penotariado.com internal API for better data granularity.

---

## Key Decisions to Make

1. **Which zones in A Coruña?** Define the specific neighborhoods/postal codes to track. Candidates: Centro, Eirís, Monte Alto, Os Mallos, Elviña, Riazor, Cuatro Caminos, etc.

2. **Idealista API quota management.** With ~100 req/month free, we need to be strategic:
   - Option A: Track fewer zones with daily updates.
   - Option B: Track more zones with weekly rotation.
   - Option C: Use Apify/scraping for higher volume.

3. **Charting library.** Chart.js (lighter, simpler) vs ECharts (more powerful, better for financial-style charts). Given we want price trends and comparisons, **ECharts** is likely the better fit.

4. **Notification system.** Future feature: alert when a listing drops price or new listing matches criteria. Could use email (Resend free tier) or Telegram bot.

---

## Environment Variables

```env
# Turso
TURSO_DATABASE_URL=libsql://pisazo-xxx.turso.io
TURSO_AUTH_TOKEN=eyJ...

# Idealista
IDEALISTA_API_KEY=xxx
IDEALISTA_API_SECRET=xxx

# Site
NUXT_SITE_URL=https://pisazo.netlify.app
NUXT_SITE_NAME=Pisazo

# Netlify (optional rebuild trigger)
NETLIFY_BUILD_HOOK_URL=https://api.netlify.com/build_hooks/xxx
```

---

## Cost Estimate

| Service | Free Tier | Our Usage | Cost |
|---------|-----------|-----------|------|
| Turso | 9 GB, 500M reads/mo | <100 MB, <10K reads/mo | **$0** |
| Netlify | 300 build min/mo, 100 GB bandwidth | Light traffic | **$0** |
| GitHub Actions | 2,000 min/mo (public repo) | ~5 min/day = 150 min/mo | **$0** |
| Idealista API | ~100 req/mo (estimated) | ~30-60 req/mo | **$0** |
| Domain (optional) | — | pisazo.gal or similar | ~€10/year |
| **Total** | | | **$0/month** |
