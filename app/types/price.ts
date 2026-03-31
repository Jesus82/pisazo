// ─── DB row types (raw Drizzle select results) ───

export interface DbPriceSnapshot {
  id: number
  listing_id: string
  date: string
  price: number | null
  price_m2: number | null
}

// ─── App types (what components receive) ───

export interface PriceSnapshot {
  id: number
  listingId: string
  date: string
  price: number | null
  priceM2: number | null
}
