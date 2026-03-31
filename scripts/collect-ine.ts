import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { ineIpva } from '../server/database/schema'

// INE IPVA series codes for A Coruña's 10 census districts
// Table 59061: Índice de Precios de Vivienda por distritos (experimental)
// Data is ANNUAL (FK_Periodo=28), base 100 = 2015
const DISTRICT_SERIES = [
  { district: '01', indexCode: 'IPVA7897', variationCode: 'IPVA8304' },
  { district: '02', indexCode: 'IPVA7896', variationCode: 'IPVA8303' },
  { district: '03', indexCode: 'IPVA7895', variationCode: 'IPVA8302' },
  { district: '04', indexCode: 'IPVA7894', variationCode: 'IPVA8301' },
  { district: '05', indexCode: 'IPVA7893', variationCode: 'IPVA8300' },
  { district: '06', indexCode: 'IPVA7892', variationCode: 'IPVA8299' },
  { district: '07', indexCode: 'IPVA7891', variationCode: 'IPVA8298' },
  { district: '08', indexCode: 'IPVA7890', variationCode: 'IPVA8297' },
  { district: '09', indexCode: 'IPVA7889', variationCode: 'IPVA8296' },
  { district: '10', indexCode: 'IPVA7888', variationCode: 'IPVA8295' },
]

const INE_API_BASE = 'https://servicios.ine.es/wstempus/js/ES'

interface IneDataPoint {
  Fecha: number
  FK_Periodo: number
  Anyo: number
  Valor: number
}

interface IneSeriesResponse {
  COD: string
  Nombre: string
  Data: IneDataPoint[]
}

async function fetchSeries(code: string, nult: number = 15): Promise<IneSeriesResponse> {
  const url = `${INE_API_BASE}/DATOS_SERIE/${code}?nult=${nult}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`INE API error for ${code}: ${response.status}`)
  }

  return await response.json()
}

export async function collectIne(db: LibSQLDatabase, _today: string) {
  let inserted = 0
  let skipped = 0

  for (const { district, indexCode, variationCode } of DISTRICT_SERIES) {
    try {
      const [indexData, variationData] = await Promise.all([
        fetchSeries(indexCode, 15),
        fetchSeries(variationCode, 15),
      ])

      // Build a map of year → annual variation
      const variationMap = new Map<number, number>()
      for (const point of variationData.Data) {
        variationMap.set(point.Anyo, point.Valor)
      }

      for (const point of indexData.Data) {
        // IPVA data is annual — use YYYY as the quarter label
        const quarter = String(point.Anyo)

        try {
          await db.insert(ineIpva).values({
            districtCode: district,
            quarter,
            indexValue: point.Valor,
            annualVariation: variationMap.get(point.Anyo) ?? null,
            source: indexCode,
          }).onConflictDoNothing()
          inserted++
        } catch {
          skipped++
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (err) {
      console.error(`    ✗ District ${district}: ${err}`)
    }
  }

  console.log(`  📊 INE IPVA: ${inserted} records inserted, ${skipped} skipped`)
}
