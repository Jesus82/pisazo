# Data Model & Source Complementarity

What each data source measures, what it cannot tell us, and how combining them produces insights that no single source can provide alone.

---

## The Four Price Layers

Every property in A Coruña has multiple "prices" depending on who you ask and when:

```
  HIGHER ▲
         │
         │   ┌─────────────────────────────┐
         │   │  1. IDEALISTA ASKING PRICE   │  What the seller wants
         │   │     (daily, per property)     │  Always the highest — pre-negotiation
         │   └─────────────────────────────┘
         │
         │   ┌─────────────────────────────┐
         │   │  2. INE PRICE INDEX (IPVA)   │  What appraisers say it's worth
         │   │     (annual, per district)    │  Base 100 = 2015, tracks trend
         │   └─────────────────────────────┘
         │
         │   ┌─────────────────────────────┐
         │   │  3. NOTARIADO REAL PRICE     │  What the buyer actually paid
         │   │     (monthly, per postal code)│  From notarized purchase deeds
         │   └─────────────────────────────┘
         │
         │   ┌─────────────────────────────┐
         │   │  4. REGISTRADORES VOLUME     │  How many sales are happening
         │   │     (quarterly, provincial)   │  Market activity indicator
         │   └─────────────────────────────┘
         │
  LOWER  ▼
```

The **gap** between layers 1 and 3 is the negotiation margin — typically 10–25% in A Coruña.

---

## Source-by-Source: What Each One Tells Us

### 1. Idealista — The Seller's Perspective

**What it measures:** Asking prices — what sellers and agencies publish as their desired sale price.

**Unique contributions:**
- **Property-level detail** — the only source with individual addresses, floor plans, photos, bedrooms, bathrooms, size, features
- **Daily price tracking** — we can see when a seller drops their price, and by how much
- **Time on market** — how long a listing survives before being removed (proxy for demand)
- **Supply indicator** — number of active listings per zone measures how much inventory exists

**What it cannot tell us:**
- What the property actually sells for (the accepted offer is always lower)
- Whether a delisted property was sold, rented, or just withdrawn
- Properties sold off-market or through other portals (Fotocasa, private sales)

**Data characteristics:**

| Dimension      | Value |
|----------------|-------|
| Granularity    | Individual property |
| Geography      | Point coordinates (lat/lng) |
| Frequency      | Daily snapshots |
| Lag            | Real-time |
| Price type     | Asking price (pre-negotiation) |
| Coverage       | ~60-70% of listed market in A Coruña |

---

### 2. INE IPVA — The Market Trend

**What it measures:** A price index (base 100 = 2015) that tracks how housing prices evolve over time, at census district level. Based on property appraisals and transaction data processed by INE.

**Unique contributions:**
- **District granularity** — 10 census districts within A Coruña city, more granular than provincial data
- **Long time series** — data back to 2010, showing the full post-crisis recovery
- **Trend normalization** — as an index, it removes composition effects (mix of large/small properties changing quarter to quarter)
- **Annual variation** — pre-calculated year-on-year change percentage

**What it cannot tell us:**
- Absolute prices (it's an index, not a €/m² figure)
- Monthly or daily movements (annual resolution only)
- Individual property prices

**Data characteristics:**

| Dimension      | Value |
|----------------|-------|
| Granularity    | Census district (10 in A Coruña) |
| Geography      | Census district boundaries |
| Frequency      | Annual |
| Lag            | ~6-12 months |
| Price type     | Composite index (appraisals + transactions) |
| Coverage       | All registered transactions |

**Census district ↔ Idealista district mapping:**

The INE census districts don't map 1:1 to Idealista's 14 zones. This is a known approximation:

| INE district | Closest Idealista zone(s) |
|-------------|--------------------------|
| 01          | Ciudad Vieja - Centro |
| 02          | Monte Alto - Zalaeta - Atocha |
| 03          | Ensanche - Juan Flórez |
| 04          | Riazor - Visma, Sagrada Familia |
| 05          | Os Mallos |
| 06          | Agra del Orzán - Ventorrillo |
| 07          | Los Castros - Castrillón, Cuatro Caminos |
| 08          | Someso - Matogrande |
| 09          | Eirís, Los Rosales |
| 10          | Elviña - A Zapateira, Mesoiro |

---

### 3. Notariado — The Buyer's Reality

**What it measures:** Average prices from notarized purchase deeds (escrituras de compraventa). Every property sale in Spain must be notarized, making this the most comprehensive record of what buyers actually pay.

**Unique contributions:**
- **Real transaction prices** — not asking, not appraised, but the price written in the deed
- **Transaction volume** — exact count of sales per postal code
- **Buyer demographics** — percentage of foreign buyers
- **Surface data** — average property size sold, enabling meaningful €/m² comparisons

**What it cannot tell us:**
- Individual transaction details (only aggregates)
- Which specific properties were sold
- Whether the deed price reflects the full amount (underdeclaration has decreased but may still exist marginally)
- Monthly timing of individual sales within the reporting period

**Data characteristics:**

| Dimension      | Value |
|----------------|-------|
| Granularity    | Postal code |
| Geography      | Postal code boundaries |
| Frequency      | Monthly |
| Lag            | 2-3 months |
| Price type     | Deed price (post-negotiation) |
| Coverage       | 100% of notarized transactions |

---

### 4. Registradores — The Market Pulse

**What it measures:** Volume of housing transactions registered in the Property Registry for A Coruña province. Tracks how many properties change hands each month.

**Unique contributions:**
- **Market activity barometer** — rising volume = hot market, falling volume = cooling
- **Seasonal patterns** — visible quarterly cycles in buying activity
- **New vs secondhand split** — separate counts for new construction vs resale
- **Leading indicator** — transaction volume often leads price changes by 1-2 quarters

**What it cannot tell us:**
- Prices (the INE series only provides counts; price data requires the Registradores CSV which is WAF-blocked)
- Granularity below provincial level
- Property characteristics

**Data characteristics:**

| Dimension      | Value |
|----------------|-------|
| Granularity    | Provincial (A Coruña province) |
| Geography      | Province boundary |
| Frequency      | Monthly (aggregated to quarterly) |
| Lag            | 1-2 months |
| Price type     | None (volume only) |
| Coverage       | All registered property transfers |

---

### 5. IDE A Coruña — The Geography

**What it provides:** Polygon boundaries for 109 individual neighborhoods (barrios), merged into 14 Idealista districts.

This is not a price data source — it provides the **geographic framework** that allows us to display all other data on a map and assign listings to districts.

---

## How Sources Complement Each Other

### Gap Analysis: Asking vs Real

The primary insight Pisazo provides is the **spread between Idealista asking prices and Notariado real prices**:

```
gap% = ((Idealista avg €/m²) − (Notariado avg €/m²)) / (Notariado avg €/m²) × 100
```

This tells a buyer: "In this zone, sellers typically ask X% more than what properties actually sell for."

### Trend Validation: Index vs Absolute

The INE IPVA index confirms whether absolute price changes from Idealista and Notariado reflect genuine market movements or compositional shifts:

- If Idealista shows prices rising but IPVA index is flat → the mix of listed properties changed (e.g., more luxury listings)
- If IPVA index is rising but Notariado prices are flat → transactions are skewing toward cheaper properties while the overall market rises
- If all three agree → strong signal of a genuine price movement

### Volume Context: Activity vs Prices

The Registradores transaction count adds crucial context to price data:

- **Rising prices + rising volume** → genuine demand-driven growth
- **Rising prices + falling volume** → supply shortage or speculative pricing
- **Falling prices + rising volume** → price correction attracting buyers
- **Falling prices + falling volume** → market in contraction

### Temporal Layering

Each source has a different update cadence, creating a time-layered view:

```
Timeline →

Daily:      │ Idealista asking prices (real-time supply/demand)
Monthly:    │ Notariado real prices (2-3 month lag)
Quarterly:  │ Registradores volume (1-2 month lag)
Annual:     │ INE IPVA index (6-12 month lag)
```

The faster-updating sources (Idealista) serve as leading indicators for the slower, more authoritative sources (Notariado, INE).

---

## Database Schema Summary

| Table                | Source        | Records per zone | Update frequency |
|----------------------|---------------|------------------|-----------------|
| `listings`           | Idealista     | ~10-50 active    | Daily           |
| `price_snapshots`    | Idealista     | 1 per listing/day| Daily           |
| `notariado_stats`    | Notariado     | 1 per month      | Monthly         |
| `ine_ipva`           | INE           | 1 per year       | Annual          |
| `registradores_stats`| Registradores | 1 per quarter    | Quarterly       |
| `market_metrics`     | Computed      | 1 per day        | Daily           |
| `zones`              | Seed data     | 14 total         | Static          |

---

## Future Sources

| Source | What it adds | Priority |
|--------|-------------|----------|
| **Catastro Valor de Referencia** | Per-property fiscal value (annual) — a third price point between asking and real | High |
| **Fotocasa** | Second asking-price portal — cross-validation of Idealista prices | Medium |
| **Tinsa IMIE** | Professional appraisal index — bank's perspective on value | Medium |
| **ECB RESR** | Euro-zone comparison — is A Coruña following the European trend? | Low |
