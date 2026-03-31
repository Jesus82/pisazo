import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { registradoresStats } from '../server/database/schema'

// The Registradores CSV endpoint blocks automated requests (WAF).
// We use the INE's "Transmisiones de derechos de propiedad" (table 6150)
// which provides monthly provincial sales from the Property Registry.
//
// Series: ETDP1546 = "Coruña, A. General. Compraventa. Número."
// FK_Periodo: 1=Jan, 2=Feb, ..., 12=Dec (monthly data)

const INE_API_BASE = 'https://servicios.ine.es/wstempus/js/ES'
const CORUNA_TOTAL_SALES = 'ETDP1546'
const CORUNA_NEW_SALES = 'ETDP1545'
const CORUNA_SECONDHAND_SALES = 'ETDP1544'

interface IneDataPoint {
  FK_Periodo: number
  Anyo: number
  Valor: number
}

interface IneSeriesResponse {
  COD: string
  Nombre: string
  Data: IneDataPoint[]
}

export async function collectRegistradores(db: LibSQLDatabase, _today: string) {
  let inserted = 0

  try {
    // Fetch total + secondhand sales for A Coruña province (last 36 months)
    const [totalRes, secondhandRes] = await Promise.all([
      fetch(`${INE_API_BASE}/DATOS_SERIE/${CORUNA_TOTAL_SALES}?nult=36`),
      fetch(`${INE_API_BASE}/DATOS_SERIE/${CORUNA_SECONDHAND_SALES}?nult=36`),
    ])

    if (!totalRes.ok || !secondhandRes.ok) {
      console.error(`    ✗ INE API error: total=${totalRes.status}, secondhand=${secondhandRes.status}`)
      return
    }

    const totalData: IneSeriesResponse = await totalRes.json()
    const secondhandData: IneSeriesResponse = await secondhandRes.json()

    // Group monthly data into quarters
    const quarterlyTotal = new Map<string, number>()
    for (const point of totalData.Data) {
      const quarter = Math.ceil(point.FK_Periodo / 3)
      const key = `${point.Anyo}-Q${quarter}`
      quarterlyTotal.set(key, (quarterlyTotal.get(key) ?? 0) + point.Valor)
    }

    // Also track secondhand separately (useful context)
    const quarterlySecondhand = new Map<string, number>()
    for (const point of secondhandData.Data) {
      const quarter = Math.ceil(point.FK_Periodo / 3)
      const key = `${point.Anyo}-Q${quarter}`
      quarterlySecondhand.set(key, (quarterlySecondhand.get(key) ?? 0) + point.Valor)
    }

    for (const [quarter, numSales] of quarterlyTotal) {
      try {
        await db.insert(registradoresStats).values({
          province: 'A Coruña',
          quarter,
          numSales: Math.round(numSales),
          avgPrice: null, // Price data requires the Registradores CSV
          avgPriceM2: null,
          numGarageSales: null,
          avgGaragePrice: null,
        }).onConflictDoNothing()
        inserted++
      } catch {
        // Already exists
      }
    }

    console.log(`  📊 Registradores (via INE): ${inserted} quarters for A Coruña province`)
  } catch (err) {
    console.error(`    ✗ Registradores collection failed: ${err}`)
  }
}
