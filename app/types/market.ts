// ─── DB row types (raw Drizzle select results) ───

export interface DbMarketMetric {
  id: number
  zone_id: number
  date: string
  median_asking_price: number | null
  avg_asking_price_m2: number | null
  num_active_listings: number | null
  num_new_listings: number | null
  num_delisted: number | null
  avg_days_on_market: number | null
  asking_vs_notariado_gap: number | null
}

// ─── App types (what components receive) ───

export interface MarketMetric {
  id: number
  zoneId: number
  date: string
  medianAskingPrice: number | null
  avgAskingPriceM2: number | null
  numActiveListings: number | null
  numNewListings: number | null
  numDelisted: number | null
  avgDaysOnMarket: number | null
  askingVsNotariadoGap: number | null
}
