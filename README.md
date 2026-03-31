# Pisazo — Apartment Price Tracker for A Coruña

A Nuxt 4 web application that tracks apartment prices in A Coruña by combining **Idealista listing data** (asking prices) with **Notariado real transaction data** (actual sale prices from notarized deeds). Data is collected daily and persisted in Turso (libSQL).

**Live:** [pisazo.netlify.app](https://pisazo.netlify.app)

## System Design Overview

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Nuxt 4 + Vue 3)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │    Pages      │   │  Components  │   │  Composables │   │    Utils     │  │
│  ├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤  │
│  │ index        │──▶│ ZoneMap      │   │ useZones     │◀──│ transformers │  │
│  │ zones/[slug] │   │ NotariadoBar │   │ useListings  │   │              │  │
│  │ listings/[id]│   │ PriceTrend   │   │ useNotariado │   │              │  │
│  │ insights     │   │              │   │ useMetrics   │   │              │  │
│  └──────────────┘   └──────────────┘   └──────┬───────┘   └──────────────┘  │
│                                                │                             │
│  ┌─────────────────────────────────────────────┼──────────────────────────┐  │
│  │                      Types Layer            │                          │  │
│  ├─────────────────────────────────────────────┼──────────────────────────┤  │
│  │  zone.ts   listing.ts   price.ts   market.ts   notariado.ts           │  │
│  │  DbZone → Zone    DbListing → Listing    DbNotariadoStat → Notariado  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────┬───────────────────────────┘
                                                   │ $fetch('/api/...')
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     SERVER (Nitro / Netlify Functions)                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐   ┌──────────────────────────────────────┐    │
│  │       API Routes         │   │          Database Layer              │    │
│  ├──────────────────────────┤   ├──────────────────────────────────────┤    │
│  │ GET /api/zones           │   │  Drizzle ORM (schema.ts)            │    │
│  │ GET /api/zones/:slug     │──▶│  → zones, listings, price_snapshots │    │
│  │ GET /api/listings        │   │  → notariado_stats, market_metrics  │    │
│  │ GET /api/listings/:id    │   │                                     │    │
│  │ GET /api/metrics/:zone   │   │  db.ts (Turso client singleton)     │    │
│  │ GET /api/notariado       │   └──────────────────┬─────────────────┘    │
│  │ GET /api/notariado/:zone │                       │                      │
│  └──────────────────────────┘                       ▼                      │
│                                          ┌──────────────────┐              │
│                                          │  Turso (libSQL)   │              │
│                                          │  aws-eu-west-1    │              │
│                                          └──────────────────┘              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                   DATA COLLECTION (GitHub Actions cron)                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  scripts/collect.ts — daily at 08:00 UTC                                     │
│  ┌───────────────────┐  ┌────────────────────┐  ┌───────────────────────┐   │
│  │ collect-idealista  │  │ collect-notariado  │  │   compute-metrics    │   │
│  │ OAuth2 → Search   │  │ ArcGIS FeatureSrv  │  │ Aggregate daily      │   │
│  │ Upsert listings   │  │ Postal code stats  │  │ Median, avg, gaps    │   │
│  │ Price snapshots   │  │ Monthly update     │  │ Asking vs real       │   │
│  └───────────────────┘  └────────────────────┘  └───────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. DASHBOARD (home page)
   ┌──────────┐  /api/notariado  ┌──────────┐    Drizzle     ┌──────────┐
   │  index   │ ────────────────▶│  Server  │ ──────────────▶│  Turso   │
   │  .vue    │ ◀── Zone[] ──── │  Route   │ ◀── rows ───── │          │
   └──────────┘  + Notariado[]  └──────────┘                 └──────────┘
        │
        ▼
   ┌──────────┐    ┌──────────────┐    ┌──────────────────┐
   │ ZoneMap  │    │ NotariadoBar │    │ Summary Cards    │
   │ (Leaflet)│    │ (ECharts)    │    │ avg €/m², total  │
   └──────────┘    └──────────────┘    └──────────────────┘

2. ZONE DETAIL
   ┌──────────┐  /api/zones/:slug  ┌──────────┐  zone + metrics  ┌──────────┐
   │  [slug]  │ ──────────────────▶│  Server  │ ────────────────▶│  Turso   │
   │  .vue    │ /api/notariado/:z  │          │  notariado stats │          │
   │          │ /api/listings?zone │          │  listings + price│          │
   └──────────┘                    └──────────┘                   └──────────┘

3. DAILY COLLECTION (cron)
   ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
   │ GitHub   │───▶│ Idealista │───▶│  Turso   │◀───│ Notariado│
   │ Actions  │    │ Search API│    │ (upsert) │    │ ArcGIS   │
   └──────────┘    └───────────┘    └──────────┘    └──────────┘
```

### Key Components

| Layer           | Component              | Responsibility                                        |
| --------------- | ---------------------- | ----------------------------------------------------- |
| **Pages**       | `index.vue`            | Dashboard: summary cards, map, bar chart, zone grid   |
|                 | `zones/[slug].vue`     | Zone detail: notariado stats, Idealista listings      |
|                 | `listings/[id].vue`    | Listing detail: price history, property features      |
|                 | `insights.vue`         | Market analysis (coming soon)                         |
| **Components**  | `ZoneMap`              | Leaflet map with GeoJSON district polygons            |
|                 | `NotariadoBarChart`    | ECharts horizontal bar chart (€/m² by zone)           |
|                 | `PriceTrend`           | ECharts line chart (price history over time)           |
| **Composables** | `useZones`             | Fetch zones list and zone detail with metrics         |
|                 | `useListings`          | Fetch listings by zone with latest price              |
|                 | `useMarketMetrics`     | Fetch daily market metrics time series                |
|                 | `useNotariado`         | Fetch notarial stats by zone                          |
| **Types**       | `zone.ts`              | `DbZone`, `Zone`, `ZoneWithMetrics`                   |
|                 | `listing.ts`           | `DbListing`, `Listing`, `ListingWithHistory`          |
|                 | `price.ts`             | `DbPriceSnapshot`, `PriceSnapshot`                    |
|                 | `market.ts`            | `DbMarketMetric`, `MarketMetric`                      |
|                 | `notariado.ts`         | `DbNotariadoStat`, `NotariadoStat`                    |
| **Utils**       | `transformers.ts`      | `DbXxx → Xxx` type transformation functions           |
| **Server**      | `db.ts`                | Turso/Drizzle singleton connection                    |
|                 | `schema.ts`            | 5-table Drizzle ORM schema                            |
| **Scripts**     | `collect.ts`           | Daily orchestrator (Idealista + Notariado + metrics)  |
|                 | `collect-idealista.ts` | Idealista Search API integration                      |
|                 | `collect-notariado.ts` | Portal del Notariado ArcGIS scraper                   |
|                 | `compute-metrics.ts`   | Daily aggregate market metrics                        |
|                 | `seed-zones.ts`        | 14 A Coruña districts                                 |

### CSS Architecture

```
┌─────────────────────────────────────────────────────┐
│                   ITCSS Layers                      │
├─────────────────────────────────────────────────────┤
│  @layer config      → CSS custom properties          │
│                       Colors (Atlantic blue palette)  │
│                       Fluid type scale (clamp)        │
│                       Spacing, containers, easing     │
│  @layer generic     → Reset, base elements            │
│  @layer layouts     → l-general, l-container, l-grid  │
│  @layer objects     → (reserved for shared patterns)  │
│  @layer utilities   → Visibility, truncation          │
│  @layer transitions → (reserved for animations)       │
├─────────────────────────────────────────────────────┤
│  Component <style scoped> → ZoneMap, metric-card...  │
├─────────────────────────────────────────────────────┤
│  Tailwind utilities (u- prefix) via @tailwind         │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Category        | Technology                                    |
| --------------- | --------------------------------------------- |
| **Framework**   | Nuxt 4.4 (Vue 3, Composition API)             |
| **Language**    | TypeScript                                    |
| **Database**    | Turso (libSQL) — aws-eu-west-1                |
| **ORM**         | Drizzle ORM                                   |
| **Styling**     | Tailwind CSS 3 (`u-` prefix) + ITCSS layers   |
| **Charts**      | Apache ECharts (via vue-echarts)              |
| **Maps**        | Leaflet + GeoJSON district polygons            |
| **Deployment**  | Netlify (SSR via Nitro)                        |
| **CI/CD**       | GitHub Actions (daily cron + deploy on push)   |
| **Data: Asking**| Idealista Search API (OAuth2)                  |
| **Data: Real**  | Portal del Notariado (ArcGIS FeatureServer)    |
| **Boundaries**  | IDE A Coruña (109 barrios → 14 districts)      |

---

## Setup

```bash
npm install
```

Create a `.env` file (see `.env.example`):

```bash
cp .env.example .env
# Fill in Turso and Idealista credentials
```

## Development

```bash
npm run dev
```

## Database

```bash
npm run db:push      # Push schema to Turso
npm run db:studio    # Open Drizzle Studio
npm run seed:zones   # Seed the 14 A Coruña districts
```

## Data Collection

```bash
npm run collect      # Run full daily collection (Idealista + Notariado + metrics)
```

## Production

```bash
npm run build        # Build for Netlify
```

## Project Structure

```
pisazo/
├── app/
│   ├── assets/css/              # ITCSS architecture
│   │   ├── config/config.css    # Design tokens (colors, typography, spacing)
│   │   ├── generic/             # Reset + base element styles
│   │   ├── layouts/             # Layout objects (l-general, l-container, l-grid)
│   │   ├── utilities/           # Utility classes + custom media queries
│   │   └── main.css             # Layer imports + Tailwind
│   ├── components/
│   │   ├── Chart/               # ECharts components (NotariadoBarChart, PriceTrend)
│   │   └── Map/                 # Leaflet ZoneMap with GeoJSON polygons
│   ├── composables/             # Data fetching (useZones, useListings, useNotariado)
│   ├── pages/                   # File-based routing (index, zones/[slug], listings/[id])
│   ├── types/                   # Domain-specific type files (zone, listing, price, market, notariado)
│   ├── utils/transformers.ts    # DbXxx → Xxx type transformations
│   ├── plugins/echarts.client.ts
│   └── app.vue                  # Root layout (header, main, footer)
├── server/
│   ├── api/                     # Nitro API routes
│   │   ├── zones/               # GET / and GET /:slug
│   │   ├── listings/            # GET / and GET /:id
│   │   ├── metrics/             # GET /:zone (time series)
│   │   └── notariado/           # GET / (overview) and GET /:zone
│   ├── database/
│   │   └── schema.ts            # Drizzle ORM schema (5 tables)
│   └── utils/db.ts              # Turso client singleton
├── scripts/
│   ├── collect.ts               # Daily orchestrator
│   ├── collect-idealista.ts     # Idealista API integration
│   ├── collect-notariado.ts     # Notariado ArcGIS scraper
│   ├── compute-metrics.ts       # Daily market metric aggregation
│   └── seed-zones.ts            # 14 districts seed data
├── public/
│   └── districts.geojson        # 109 barrios merged into 14 Idealista districts
├── .github/workflows/
│   └── collect.yml              # Daily cron (08:00 UTC)
├── nuxt.config.ts
├── drizzle.config.ts
├── tailwind.config.js
├── netlify.toml
└── package.json
```
