// ─── DB row types ───

export interface DbIneIpva {
  id: number
  district_code: string
  quarter: string
  index_value: number | null
  annual_variation: number | null
  source: string
}

// ─── App types ───

export interface IneIpva {
  id: number
  districtCode: string
  quarter: string
  indexValue: number | null
  annualVariation: number | null
  source: string
}
