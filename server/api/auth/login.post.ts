import { z } from 'zod'

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Format email tidak valid.')),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

export default defineEventHandler(async event => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Data masuk tidak valid.')
  }

  const { email, password } = parsed.data
  const account = await prisma.user.findUnique({ where: { email } })

  // Pesan sengaja sama untuk email tidak ada dan kata sandi salah, supaya
  // tidak membocorkan email mana yang terdaftar.
  const valid = account ? await verifyPassword(account.passwordHash, password) : false
  if (!account || !valid) {
    throw fail(401, 'Email atau kata sandi salah.')
  }

  const user = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role,
  }
  await setUserSession(event, { user })
  return user
})
