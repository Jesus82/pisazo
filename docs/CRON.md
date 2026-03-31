# Daily Data Collection (Cron)

Pisazo collects data automatically every day via a GitHub Actions workflow. The pipeline runs three steps in sequence, each tolerant of missing credentials or temporary failures.

## Schedule

| Field     | Value                                  |
| --------- | -------------------------------------- |
| **Cron**  | `0 8 * * *` (08:00 UTC / 10:00 CEST)  |
| **Runner**| `ubuntu-latest` (Node 22)              |
| **Timeout**| 10 minutes                            |
| **Trigger**| Scheduled + manual (`workflow_dispatch`) |
| **File**  | `.github/workflows/collect.yml`        |

## Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                 scripts/collect.ts                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Idealista (conditional)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ IF NUXT_IDEALISTA_API_KEY is set:                      │ │
│  │   → Authenticate (OAuth2 Client Credentials)           │ │
│  │   → Search each zone (lat/lng + radius)                │ │
│  │   → Upsert listings (new / update lastSeen)            │ │
│  │   → Insert price_snapshots (one per listing per day)   │ │
│  │   → Mark missing listings as "delisted"                │ │
│  │ ELSE:                                                  │ │
│  │   → Skip gracefully (log and continue)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  Step 2: Compute Metrics (always runs)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ For each zone:                                         │ │
│  │   → Aggregate active listings (median, avg €/m²)       │ │
│  │   → Count new/delisted today                           │ │
│  │   → Calculate avg days on market                       │ │
│  │   → Compute asking-vs-notariado gap (%)                │ │
│  │   → Upsert into market_metrics                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  Step 3: Notariado (always runs)                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ → Query ArcGIS FeatureServer by postal code            │ │
│  │ → No auth required (public endpoint)                   │ │
│  │ → Upsert into notariado_stats                          │ │
│  │ → ~monthly updates (data lags 2-3 months)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Required Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret                  | Required | Description                            |
| ----------------------- | -------- | -------------------------------------- |
| `TURSO_DB_URL`          | Yes      | `libsql://pisazo-xxx.turso.io`         |
| `TURSO_AUTH_TOKEN`      | Yes      | Turso database auth token              |
| `IDEALISTA_API_KEY`     | No*      | Idealista API key (Step 1 skipped if empty) |
| `IDEALISTA_API_SECRET`  | No*      | Idealista API secret                   |

*Step 1 (Idealista) is skipped gracefully when these are not set. Steps 2 and 3 always run.

## Running Manually

**From GitHub:**
```
gh workflow run collect.yml
```

**Locally:**
```bash
npm run collect
```

Requires `.env` with `NUXT_TURSO_DB_URL` and `NUXT_TURSO_AUTH_TOKEN` set.

## Scripts

| Script                    | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `scripts/collect.ts`      | Orchestrator — runs all three steps in sequence  |
| `scripts/collect-idealista.ts` | Idealista Search API → listings + price_snapshots |
| `scripts/collect-notariado.ts` | Notariado ArcGIS → notariado_stats              |
| `scripts/compute-metrics.ts`  | Aggregate → market_metrics                      |

## Database Tables Affected

| Table              | Step | Operation   | Key                          |
| ------------------ | ---- | ----------- | ---------------------------- |
| `listings`         | 1    | Upsert      | `id` (Idealista property code) |
| `price_snapshots`  | 1    | Insert      | `(listing_id, date)` unique  |
| `market_metrics`   | 2    | Upsert      | `(zone_id, date)` unique     |
| `notariado_stats`  | 3    | Upsert      | `(zone_id, month)` unique    |

## Monitoring

Check the latest run:
```bash
gh run list --workflow=collect.yml --limit 5
```

View logs of a failed run:
```bash
gh run view <run-id> --log-failed
```

## Current Status

- **Step 1 (Idealista):** Skipped — API access requested, waiting for approval
- **Step 2 (Metrics):** Running — aggregates existing data (currently empty until Idealista is active)
- **Step 3 (Notariado):** Running — successfully collecting data for all 14 zones
