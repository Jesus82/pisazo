import { asc } from 'drizzle-orm'
import { ineIpva } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDb()

  const data = await db.select()
    .from(ineIpva)
    .orderBy(asc(ineIpva.districtCode), asc(ineIpva.quarter))

  return data
})
