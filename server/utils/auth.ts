import type { H3Event } from 'h3'

/** Sesi yang sudah masuk, atau 401 kalau belum. */
export async function requireAuth(event: H3Event) {
  const { user } = await requireUserSession(event)
  if (!user) {
    throw fail(401, 'Kamu belum masuk.')
  }
  return user
}

/** Seperti requireAuth, tapi hanya untuk role admin. */
export async function requireAdmin(event: H3Event) {
  const user = await requireAuth(event)
  if (user.role !== 'admin') {
    throw fail(403, 'Halaman ini khusus admin.')
  }
  return user
}
