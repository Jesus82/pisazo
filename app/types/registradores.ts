// ─── DB row types ───

export interface DbRegistradoresStats {
  id: number
  province: string
  quarter: string
  num_sales: number | null
  avg_price: number | null
  avg_price_m2: number | null
  num_garage_sales: number | null
  avg_garage_price: number | null
}

// ─── App types ───

export interface RegistradoresStats {
  id: number
  province: string
  quarter: string
  numSales: number | null
  avgPrice: number | null
  avgPriceM2: number | null
  numGarageSales: number | null
  avgGaragePrice: number | null
}
