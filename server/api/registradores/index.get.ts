import { asc } from 'drizzle-orm'
import { registradoresStats } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDb()

  const data = await db.select()
    .from(registradoresStats)
    .orderBy(asc(registradoresStats.quarter))

  return data
})
