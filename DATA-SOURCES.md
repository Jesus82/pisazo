# Data Sources

Pisazo combines two fundamentally different data sources to give buyers a complete picture of the A Coruña real estate market. Each source tells a different part of the story — and the gap between them is where the insight lives.

```
┌─────────────────────────┐                    ┌─────────────────────────┐
│     IDEALISTA            │                    │     NOTARIADO            │
│     (Asking Prices)      │                    │     (Real Prices)        │
├─────────────────────────┤                    ├─────────────────────────┤
│ What sellers want        │                    │ What buyers actually pay │
│ Updated daily            │       GAP          │ Updated monthly (2-3mo   │
│ Individual listings      │  ◀──────────▶     │   lag from notarization) │
│ Granularity: property    │   Typically        │ Granularity: postal code │
│ Source: Search API       │   10-25% higher    │ Source: ArcGIS Feature   │
│ Auth: OAuth2 (gated)     │                    │   Server (public)        │
└─────────────────────────┘                    └─────────────────────────┘
                    │                                        │
                    ▼                                        ▼
              ┌──────────────────────────────────────────────────┐
              │                  TURSO (libSQL)                   │
              │                                                   │
              │  listings ←─── individual property records        │
              │  price_snapshots ←── daily asking price tracking  │
              │  notariado_stats ←── monthly real transaction data│
              │  market_metrics ←── daily aggregated insights     │
              │  zones ←── 14 districts of A Coruña               │
              └──────────────────────────────────────────────────┘
```

---

## 1. Idealista — Asking Prices

### What it provides

Idealista is Spain's largest real estate portal. Their Search API returns active property listings with asking prices, property details, location, and agency information. This represents **what sellers are asking for**, not what properties actually sell for.

### API details

| Field             | Value                                          |
| ----------------- | ---------------------------------------------- |
| **Endpoint**      | `https://api.idealista.com/3.5/es/search`      |
| **Auth**          | OAuth2 Client Credentials (API key + secret)   |
| **Access**        | Gated — must apply at developers.idealista.com |
| **Rate limit**    | ~100 requests/month (free tier, unconfirmed)   |
| **Data format**   | JSON                                           |
| **Update freq.**  | Real-time (listings change continuously)       |

### How we use it

We search by geographic center (lat/lng) + radius for each of the 14 districts, filtering for `operation: sale` and `propertyType: homes`. The collection script runs daily via GitHub Actions.

```
scripts/collect-idealista.ts

1. Authenticate → POST /oauth/token → Bearer token
2. For each zone:
   a. Search → GET /3.5/es/search?center={lat},{lng}&distance={radius}
   b. Paginate (maxItems=50 per page)
   c. For each property:
      - Upsert into `listings` table (new → insert, existing → update lastSeen)
      - Insert into `price_snapshots` (one row per listing per day)
   d. Mark missing listings as "delisted"
3. Wait 1s between zones (rate limiting)
```

### Data we extract per listing

| Field          | Source field       | Notes                              |
| -------------- | ------------------ | ---------------------------------- |
| `id`           | `propertyCode`     | Idealista's unique property ID     |
| `address`      | `address`          | Street-level address               |
| `lat`, `lng`   | `latitude/longitude` | Coordinates for map placement    |
| `propertyType` | `propertyType`     | flat, house, penthouse, studio...  |
| `bedrooms`     | `rooms`            | Number of bedrooms                 |
| `bathrooms`    | `bathrooms`        | Number of bathrooms                |
| `sizeM2`       | `size`             | Total area in square meters        |
| `price`        | `price`            | Asking price in EUR                |
| `priceM2`      | `priceByArea`      | Asking price per square meter      |
| `agency`       | `agency`           | Listing agency name                |
| `idealistaUrl` | `url`              | Direct link to the Idealista page  |

### Key insight: price tracking

By taking a daily snapshot of each listing's asking price, we can detect:
- **Price drops** — seller reducing the asking price over time
- **Time on market** — how long until a listing disappears
- **Delisting** — absence from search results implies sold or withdrawn

### Limitations

- Free tier is heavily rate-limited (~100 req/month)
- No price history endpoint — we build it ourselves
- No "sold" confirmation — we infer from delisting
- Access is manually reviewed and may be denied
- Fallback: Apify scraper (~€0.50/1K results) if official API is insufficient

---

## 2. Portal Estadístico del Notariado — Real Transaction Prices

### What it provides

The Consejo General del Notariado publishes aggregate statistics from actual property purchase deeds (escrituras). Every real estate sale in Spain must be notarized, so this data represents **the actual price paid** — not the asking price, not the mortgage value, but what appeared in the notarial deed.

### API details

| Field             | Value                                                           |
| ----------------- | --------------------------------------------------------------- |
| **Endpoint**      | `https://www.notariado.org/portal/arcgis/rest/services/...`     |
| **Auth**          | None (public ArcGIS FeatureServer)                              |
| **Access**        | Open — no registration needed                                   |
| **Rate limit**    | Reasonable use (no documented limit)                            |
| **Data format**   | JSON (Esri FeatureServer)                                       |
| **Update freq.**  | Monthly, with a 2-3 month lag                                   |
| **Granularity**   | Postal code level                                               |

### How we discovered the API

The public-facing portal at [penotariado.com](https://www.penotariado.com) is a Next.js SPA that displays charts and maps. By inspecting network requests, we discovered it fetches data from an ArcGIS FeatureServer hosted at `notariado.org`. This server exposes multiple layers with different granularities. We query the postal code layer directly, bypassing the frontend entirely.

### How we use it

```
scripts/collect-notariado.ts

1. Build unique list of postal codes from our 14 zones
2. For each postal code:
   a. Query ArcGIS FeatureServer with postal code filter
   b. Request fields: avg_price_m2, avg_total_price, avg_surface,
      num_transactions, pct_foreign_buyers
   c. Upsert into `notariado_stats` (keyed by zone_id + month)
3. Map postal codes back to zones (some zones share postal codes)
```

### Data we extract per postal code

| Field               | ArcGIS field          | Notes                                   |
| ------------------- | --------------------- | --------------------------------------- |
| `avgPriceM2`        | `precio_m2_medio`     | Average price per m² from deeds         |
| `avgTotalPrice`     | `precio_medio`        | Average total sale price                |
| `avgSurfaceM2`      | `superficie_media`    | Average property size                   |
| `numTransactions`   | `num_compraventas`    | Number of sales in the period           |
| `pctForeignBuyers`  | `pct_extranjeros`     | Percentage of foreign buyers            |

### Limitations

- **Monthly granularity** with a 2-3 month lag (notarization and processing time)
- **Postal code level** — cannot distinguish neighborhoods within the same postal code (e.g., 15009 covers Los Castros, Someso, and Eirís). Zones sharing a postal code receive the same notariado data.
- **Aggregate only** — no individual transaction data
- **No official API documentation** — reverse-engineered from the penotariado.com frontend

### Alternative: CIEN Portal

The older [CIEN portal](https://notariado.org/liferay/web/cien/estadisticas-al-completo) at notariado.org supports CSV/Excel export at the municipal level. This is a fallback for historical bulk data if the ArcGIS endpoint changes.

---

## 3. District Boundaries — IDE A Coruña

### What it provides

The Ayuntamiento de A Coruña publishes geographic boundary data through its IDE (Infraestructura de Datos Espaciales) portal, powered by ArcGIS MapServer.

### API details

| Field             | Value                                                                    |
| ----------------- | ------------------------------------------------------------------------ |
| **Endpoint**      | `https://ide.coruna.gal/server/rest/services/Publica/CB_DIVISIONES_ADMINISTRATIVAS/MapServer` |
| **Layer used**    | Layer 3 — Barrios/AAVV (109 individual neighborhoods)                    |
| **Auth**          | None                                                                     |
| **Data format**   | GeoJSON (converted from Esri JSON via `f=geojson&outSR=4326`)            |

### How we use it

We downloaded the 109 neighborhood polygons and merged them into Idealista's 14 official districts using Shapely's `unary_union`. The result is stored as a static GeoJSON file at `public/districts.geojson` (94 KB) and rendered on the Leaflet map.

```
109 barrios (ide.coruna.gal)
        │
        ├── ENSANCHE + JUAN FLOREZ + A FALPERRA + ... → "Ensanche - Juan Flórez"
        ├── MONTE ALTO + ZALAETA + AS ATOCHAS + ...   → "Monte Alto - Zalaeta - Atocha"
        ├── ...
        └── MESOIRO + NOVO MESOIRO + FEANS + ...       → "Mesoiro"
        │
        ▼
14 Idealista districts (public/districts.geojson)
```

### Mapping decisions

Several barrios required judgment calls for district assignment:

| Barrio                | Assigned to             | Rationale                                          |
| --------------------- | ----------------------- | -------------------------------------------------- |
| `AS LAGOAS`           | Monte Alto              | Geographically within Monte Alto peninsula          |
| `AGRA SAN AMARO`      | Monte Alto              | Between Monte Alto and Orzán, closer to Monte Alto  |
| `RIAZOR`              | Riazor - Visma          | Separated from Cuatro Caminos into its own district |
| `DARSENA DE OZA`      | Los Castros - Castrillón| Port area south of Os Castros                       |
| `REFINERIA DE PETROLEO`| Mesoiro                | Industrial zone in southern outskirts               |

---

## 4. Data Reconciliation: Asking vs Real

The core value of Pisazo is the **gap analysis** between Idealista asking prices and Notariado real prices. This gap tells buyers how much negotiation room typically exists.

### How the gap is calculated

```typescript
// In compute-metrics.ts
const gap = ((avgAskingPriceM2 - notariadoAvgPriceM2) / notariadoAvgPriceM2) * 100
```

- **Positive gap** → sellers are asking more than the real market price (common: 10-25%)
- **Negative gap** → rare; may indicate distressed sales or market correction

### Challenges

1. **Temporal mismatch**: Idealista data is real-time; Notariado data lags 2-3 months. This means the gap always compares today's asking prices against slightly outdated transaction data.

2. **Granularity mismatch**: Idealista provides per-property data; Notariado provides per-postal-code aggregates. A single postal code (e.g., 15009) may contain neighborhoods with very different price profiles.

3. **Selection bias**: Properties listed on Idealista are a subset of all properties for sale. Some sellers use other portals (Fotocasa, Kyero) or sell privately. The Notariado captures all transactions regardless of listing channel.

4. **Price type difference**: Idealista shows asking prices (pre-negotiation). Notariado shows deed prices (post-negotiation, which may also be slightly different from actual price paid due to underdeclaration, though this has decreased significantly in recent years).

### Mitigation strategies

- Compare trends rather than absolute values
- Use per-m² pricing to normalize for property size differences
- Display both sources side by side rather than a single "truth"
- Show the gap as a percentage range, not a precise figure
- Update Notariado data monthly and clearly label the data period
