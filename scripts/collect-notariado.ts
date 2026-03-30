import { eq, and } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { zones, notariadoStats } from '../server/database/schema'

/**
 * Notariado data is served via public ArcGIS FeatureServer endpoints.
 * No authentication required.
 *
 * Services:
 * - agol_precio_m2: price per m² (layers: 0=Nacional, 1=CCAA, 2=Provincia, 3=Municipio, 4=CP)
 * - agol_precio_medio: average total price (same layers)
 * - agol_superficie_media: average surface area (same layers)
 * - agol_compraventas: number of transactions (same layers)
 *
 * Filters:
 * - tipo_construccion_id: 7=new, 9=second-hand, 99=all
 * - clase_finca_urbana_id: 14=flat, 15=house, 99=all
 *
 * Data represents the latest 12-month rolling aggregate, updated monthly.
 */

const ARCGIS_BASE = 'https://services-eu1.arcgis.com/UpPGybwp9RK4YtZj/arcgis/rest/services'
const LAYER_CP = 4 // Código Postal layer

interface ArcGISFeature {
  attributes: Record<string, string | number | null>
}

interface ArcGISResponse {
  features: ArcGISFeature[]
}

async function queryArcGIS(
  service: string,
  layer: number,
  where: string,
  outFields: string,
): Promise<ArcGISFeature[]> {
  const url = new URL(`${ARCGIS_BASE}/${service}/FeatureServer/${layer}/query`)
  url.searchParams.set('f', 'json')
  url.searchParams.set('where', where)
  url.searchParams.set('outFields', outFields)
  url.searchParams.set('returnGeometry', 'false')

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`ArcGIS query failed: ${response.status} ${await response.text()}`)
  }

  const data: ArcGISResponse = await response.json()
  return data.features || []
}

// Collect all A Coruña postal codes from the Notariado ArcGIS FeatureServer
async function fetchPostalCodeData(postalCodes: string[]): Promise<Map<string, {
  precioM2: number | null
  precioMedio: number | null
  superficieMedia: number | null
  totalTransacciones: number | null
  totalInformados: number | null
}>> {
  const cpList = postalCodes.map(cp => `'${cp}'`).join(',')
  const where = `cp IN (${cpList}) AND tipo_construccion_id = 99 AND clase_finca_urbana_id = 99`
  const outFields = 'cp,precio_m2,precio_medio,superficie_media,total,total_informados'

  const features = await queryArcGIS('agol_precio_m2', LAYER_CP, where, outFields)

  const result = new Map<string, {
    precioM2: number | null
    precioMedio: number | null
    superficieMedia: number | null
    totalTransacciones: number | null
    totalInformados: number | null
  }>()

  for (const feature of features) {
    const attrs = feature.attributes
    const cp = String(attrs.cp)
    result.set(cp, {
      precioM2: attrs.precio_m2 as number | null,
      precioMedio: attrs.precio_medio as number | null,
      superficieMedia: attrs.superficie_media as number | null,
      totalTransacciones: attrs.total as number | null,
      totalInformados: attrs.total_informados as number | null,
    })
  }

  return result
}

export async function collectNotariado(db: LibSQLDatabase, today: string) {
  // Current month as YYYY-MM
  const month = today.substring(0, 7)

  const allZones = await db.select().from(zones)

  // Get unique postal codes
  const postalCodes = [...new Set(allZones.map(z => z.postalCode).filter(Boolean))] as string[]

  console.log(`  Fetching Notariado data for ${postalCodes.length} postal codes...`)
  const data = await fetchPostalCodeData(postalCodes)

  let upserted = 0
  let skipped = 0

  for (const zone of allZones) {
    if (!zone.postalCode) continue

    const cpData = data.get(zone.postalCode)
    if (!cpData) {
      console.log(`    ⚠ No Notariado data for ${zone.name} (CP ${zone.postalCode})`)
      skipped++
      continue
    }

    // Check if we already have data for this zone+month
    const existing = await db.select()
      .from(notariadoStats)
      .where(and(
        eq(notariadoStats.zoneId, zone.id),
        eq(notariadoStats.month, month),
      ))
      .get()

    if (existing) {
      // Update if data changed
      await db.update(notariadoStats)
        .set({
          avgPriceM2: cpData.precioM2,
          avgTotalPrice: cpData.precioMedio,
          avgSurfaceM2: cpData.superficieMedia,
          numTransactions: cpData.totalTransacciones,
        })
        .where(eq(notariadoStats.id, existing.id))
    } else {
      await db.insert(notariadoStats).values({
        zoneId: zone.id,
        month,
        avgPriceM2: cpData.precioM2,
        avgTotalPrice: cpData.precioMedio,
        avgSurfaceM2: cpData.superficieMedia,
        numTransactions: cpData.totalTransacciones,
      })
    }

    console.log(`    ✓ ${zone.name} (CP ${zone.postalCode}): ${cpData.precioM2} €/m², ${cpData.totalTransacciones} transacciones`)
    upserted++
  }

  console.log(`  📊 Summary: ${upserted} zones updated, ${skipped} skipped`)
}
