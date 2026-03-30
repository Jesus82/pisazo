import { zones } from '../../database/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  return await db.select().from(zones)
})
