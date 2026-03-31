# Data Ingestion

How Pisazo collects, transforms, and persists data from each external source into a unified database.

---

## Overview

```
                                External Sources
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Idealista    │  │  Notariado   │  │  INE IPVA    │  │ Registradores│  │ IDE Coruña   │
   │  Search API   │  │  ArcGIS      │  │  JSON API    │  │ (via INE)    │  │  ArcGIS      │
   │  OAuth2       │  │  Public      │  │  Public      │  │  Public      │  │  Public      │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼                 ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ collect-     │  │ collect-     │  │ collect-     │  │ collect-     │  │ (one-time    │
   │ idealista.ts │  │ notariado.ts │  │ ine.ts       │  │ registra-   │  │  build step) │
   │              │  │              │  │              │  │ dores.ts     │  │              │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼                 ▼
   ┌─────────────────────────────────────────────────────────────────────────────────────┐
   │                              TURSO (libSQL)                                         │
   ├─────────────────────────────────────────────────────────────────────────────────────┤
   │ listings · price_snapshots · notariado_stats · ine_ipva · registradores_stats       │
   │ market_metrics · zones                                                               │
   └─────────────────────────────────────────────────────────────────────────────────────┘
```

All collection runs through `scripts/collect.ts`, orchestrated daily via GitHub Actions cron (see [CRON.md](./CRON.md)).

---

## Source 1: Idealista (Asking Prices)

**Script:** `scripts/collect-idealista.ts`
**Status:** Conditional — skipped when API keys are not set.

### Connection

| Field        | Value |
|--------------|-------|
| Endpoint     | `https://api.idealista.com/3.5/es/search` |
| Auth         | OAuth2 Client Credentials |
| Token URL    | `https://api.idealista.com/oauth/token` |
| Rate limit   | ~100 req/month (free tier) |
| Format       | JSON |

### Authentication flow

```
1. Base64-encode "{apiKey}:{apiSecret}"
2. POST /oauth/token
   Header: Authorization: Basic {encoded}
   Body: grant_type=client_credentials&scope=read
3. Receive Bearer token (JWT)
```

### Collection logic

```
For each of the 14 zones:
  1. Search by center (lat, lng) + radius
     → GET /3.5/es/search?center={lat},{lng}&distance={radius}&operation=sale&propertyType=homes
  2. Paginate (maxItems=50, follow numPage)
  3. For each property in results:
     a. Upsert into `listings` (new → INSERT, existing → UPDATE last_seen)
     b. INSERT into `price_snapshots` (one row per listing per day, ON CONFLICT ignore)
  4. Mark listings NOT found today as "delisted"
  5. Wait 1s between zones (rate limiting)
```

### Target tables

| Table             | Key                    | Operation |
|-------------------|------------------------|-----------|
| `listings`        | `id` (property code)   | Upsert    |
| `price_snapshots` | `(listing_id, date)`   | Insert    |

---

## Source 2: Portal del Notariado (Real Transaction Prices)

**Script:** `scripts/collect-notariado.ts`
**Status:** Active — runs daily, data updates monthly.

### Connection

| Field        | Value |
|--------------|-------|
| Endpoint     | `https://www.notariado.org/portal/arcgis/rest/services/.../FeatureServer` |
| Auth         | None (public) |
| Format       | JSON (Esri FeatureServer) |
| Discovery    | Reverse-engineered from [penotariado.com](https://www.penotariado.com) network requests |

### Collection logic

```
1. Build unique list of postal codes from the 14 zones
2. For each postal code:
   a. Query FeatureServer with WHERE clause on postal code
   b. Request fields: precio_m2_medio, precio_medio, superficie_media,
      num_compraventas, pct_extranjeros
   c. Upsert into notariado_stats (keyed by zone_id + month)
3. Zones sharing a postal code receive the same data
   (e.g., 15009 → Los Castros, Someso, Eirís)
```

### Target table

| Table              | Key                  | Operation |
|--------------------|----------------------|-----------|
| `notariado_stats`  | `(zone_id, month)`   | Upsert    |

### Known issue: postal code granularity

Several Idealista districts share the same postal code. The Notariado data cannot distinguish between them:

| Postal code | Districts sharing it |
|-------------|---------------------|
| 15009       | Los Castros, Someso - Matogrande, Eirís |
| 15006       | Riazor - Visma, Sagrada Familia |
| 15001       | Ciudad Vieja - Centro |

---

## Source 3: INE IPVA (District-Level Price Index)

**Script:** `scripts/collect-ine.ts`
**Status:** Active — annual data.

### Connection

| Field        | Value |
|--------------|-------|
| Endpoint     | `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/{code}` |
| Auth         | None (public JSON API) |
| Table        | 59061 — Índice de Precios de Vivienda por distritos (experimental) |
| Format       | JSON |
| [API docs](https://www.ine.es/dyngs/DAB/en/index.htm?cid=1099) | |

### Series codes

A Coruña has 10 INE census districts. Each has two series:

| District | Index series | Variation series |
|----------|-------------|-----------------|
| 01       | IPVA7897    | IPVA8304        |
| 02       | IPVA7896    | IPVA8303        |
| 03       | IPVA7895    | IPVA8302        |
| 04       | IPVA7894    | IPVA8301        |
| 05       | IPVA7893    | IPVA8300        |
| 06       | IPVA7892    | IPVA8299        |
| 07       | IPVA7891    | IPVA8298        |
| 08       | IPVA7890    | IPVA8297        |
| 09       | IPVA7889    | IPVA8296        |
| 10       | IPVA7888    | IPVA8295        |

### Collection logic

```
For each of the 10 census districts:
  1. Fetch index series (last 15 data points): GET /DATOS_SERIE/{indexCode}?nult=15
  2. Fetch variation series in parallel: GET /DATOS_SERIE/{variationCode}?nult=15
  3. For each data point:
     - Format quarter as year (data is annual, FK_Periodo=28)
     - INSERT into ine_ipva (ON CONFLICT ignore)
  4. Wait 200ms between districts
```

### Target table

| Table       | Key                        | Operation |
|-------------|----------------------------|-----------|
| `ine_ipva`  | `(district_code, quarter)` | Insert    |

### Period mapping

The INE API uses `FK_Periodo` codes: `28` = annual, `20-23` = Q1–Q4, `1-12` = Jan–Dec. IPVA district data is annual only.

---

## Source 4: Registradores (Provincial Transaction Counts)

**Script:** `scripts/collect-registradores.ts`
**Status:** Active — monthly data aggregated to quarterly.

### Connection

The [Registradores Open Data portal](https://opendata.registradores.org) blocks automated requests (WAF). We proxy through the INE, which publishes the same underlying data from the Property Registry.

| Field        | Value |
|--------------|-------|
| Endpoint     | `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/{code}` |
| Auth         | None |
| INE table    | 6150 — Transmisiones de derechos de la propiedad |
| Format       | JSON |

### Series codes

| Code       | Description |
|------------|-------------|
| ETDP1546   | A Coruña — General — Compraventa — Número (total sales) |
| ETDP1545   | A Coruña — Vivienda nueva — Compraventa — Número |
| ETDP1544   | A Coruña — Vivienda segunda mano — Compraventa — Número |

### Collection logic

```
1. Fetch ETDP1546 (total monthly sales, last 36 months)
2. Fetch ETDP1544 (secondhand sales) in parallel
3. Group monthly values into quarters:
   - Jan–Mar → Q1, Apr–Jun → Q2, Jul–Sep → Q3, Oct–Dec → Q4
4. INSERT quarterly totals into registradores_stats
```

### Target table

| Table                | Key                    | Operation |
|----------------------|------------------------|-----------|
| `registradores_stats`| `(province, quarter)`  | Insert    |

### Note on price data

The INE transaction series only provides **counts** (number of sales), not prices. Average price and €/m² data requires the Registradores CSV, which is currently blocked for automated download. These fields remain `null` until manual CSV import is implemented.

---

## Source 5: IDE A Coruña (District Boundaries)

**Not a daily collection** — this is a one-time build step.

### Connection

| Field        | Value |
|--------------|-------|
| Endpoint     | `https://ide.coruna.gal/server/rest/services/Publica/CB_DIVISIONES_ADMINISTRATIVAS/MapServer/3` |
| Auth         | None |
| Format       | GeoJSON (via `f=geojson&outSR=4326`) |

### Processing

109 individual barrio polygons were downloaded and merged into 14 Idealista districts using Shapely's `unary_union`, then simplified (5m tolerance). The result is a static file at `public/districts.geojson` (94 KB).

This is not part of the daily pipeline. It only needs re-running if Idealista changes its district definitions.

---

## Consolidation: compute-metrics.ts

After all sources are collected, `scripts/compute-metrics.ts` aggregates Idealista listing data into daily market metrics per zone:

```
For each zone:
  1. Count active listings
  2. Compute median and average asking price/m²
  3. Count new listings today + delisted today
  4. Calculate average days on market
  5. Compare asking price/m² vs Notariado real price/m²
     → gap = ((asking - real) / real) × 100
  6. Upsert into market_metrics (keyed by zone_id + date)
```

This creates the unified `market_metrics` table that powers the frontend dashboard — a single source of truth combining data from all upstream sources.
