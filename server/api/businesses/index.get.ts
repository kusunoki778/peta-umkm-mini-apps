import { Prisma } from '../../../app/generated/prisma/client.ts'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().trim().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().min(100).max(20000).optional(),
  sort: z.enum(['terdekat', 'terbaru', 'nama']).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
})

type Row = {
  id: string
  slug: string
  name: string
  category_slug: string
  category_name: string
  category_color: string
  latitude: number | null
  longitude: number | null
  distance_m: number | null
  is_boosted: boolean
  boost_ends_at: Date | null
  photo_url: string | null
}

export default defineEventHandler(async event => {
  const parsed = querySchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Parameter pencarian tidak valid.')
  }

  const { q, category, lat, lng, radius, sort, limit = 40 } = parsed.data
  const categories = category ? category.split(',').filter(Boolean) : []
  const hasOrigin = typeof lat === 'number' && typeof lng === 'number'
  const radiusMeters = radius ?? 3000

  // Satu query: boost aktif lebih dulu, lalu jarak kalau titik asal dikirim,
  // lalu nama. Jarak memakai earth_distance (ekstensi earthdistance) dan
  // filter radius memakai earth_box yang terindeks GiST.
  const filters: Prisma.Sql[] = [Prisma.sql`b.status = 'live'`, Prisma.sql`b.deleted_at IS NULL`]

  if (q) {
    filters.push(Prisma.sql`(b.name ILIKE ${`%${q}%`} OR b.description ILIKE ${`%${q}%`})`)
  }
  if (categories.length) {
    filters.push(Prisma.sql`c.slug = ANY(${categories})`)
  }
  if (hasOrigin) {
    filters.push(
      Prisma.sql`b.earth_location IS NOT NULL
        AND earth_box(ll_to_earth(${lat}::float8, ${lng}::float8), ${radiusMeters}::float8) @> b.earth_location`,
    )
  }

  const distanceExpr = hasOrigin
    ? Prisma.sql`earth_distance(b.earth_location, ll_to_earth(${lat}::float8, ${lng}::float8))::float8`
    : Prisma.sql`NULL::float8`

  const orderBy = (() => {
    if (sort === 'nama') return Prisma.sql`b.name ASC`
    if (sort === 'terbaru') return Prisma.sql`b.created_at DESC`
    if (hasOrigin) return Prisma.sql`distance_m ASC NULLS LAST`
    return Prisma.sql`b.created_at DESC`
  })()

  const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
    SELECT
      b.id,
      b.slug,
      b.name,
      c.slug AS category_slug,
      c.name AS category_name,
      c.color AS category_color,
      b.latitude,
      b.longitude,
      ${distanceExpr} AS distance_m,
      EXISTS (
        SELECT 1 FROM boosts bo
        WHERE bo.business_id = b.id
          AND bo.status = 'active'
          AND bo.ends_at > now()
      ) AS is_boosted,
      (
        SELECT max(bo.ends_at) FROM boosts bo
        WHERE bo.business_id = b.id AND bo.status = 'active'
      ) AS boost_ends_at,
      (
        SELECT p.url FROM business_photos p
        WHERE p.business_id = b.id
        ORDER BY p.sort ASC, p.created_at ASC
        LIMIT 1
      ) AS photo_url
    FROM businesses b
    JOIN categories c ON c.id = b.category_id
    WHERE ${Prisma.join(filters, ' AND ')}
    ORDER BY is_boosted DESC, ${orderBy}
    LIMIT ${limit}
  `)

  return {
    origin: hasOrigin ? { lat, lng } : null,
    radius: hasOrigin ? radiusMeters : null,
    total: rows.length,
    items: rows.map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: { slug: row.category_slug, name: row.category_name, color: row.category_color },
      latitude: row.latitude,
      longitude: row.longitude,
      distanceMeters: row.distance_m === null ? null : Math.round(Number(row.distance_m)),
      isBoosted: row.is_boosted,
      boostEndsAt: row.boost_ends_at,
      photoUrl: row.photo_url,
    })),
  }
})
