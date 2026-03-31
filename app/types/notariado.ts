// ─── DB row types (raw Drizzle select results) ───

export interface DbNotariadoStat {
  id: number
  zone_id: number
  month: string
  avg_price_m2: number | null
  avg_total_price: number | null
  avg_surface_m2: number | null
  num_transactions: number | null
  pct_foreign_buyers: number | null
}

// ─── App types (what components receive) ───

export interface NotariadoStat {
  id: number
  zoneId: number
  month: string
  avgPriceM2: number | null
  avgTotalPrice: number | null
  avgSurfaceM2: number | null
  numTransactions: number | null
  pctForeignBuyers: number | null
}
