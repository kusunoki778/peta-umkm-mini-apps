import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Format email tidak valid.')),
  phone: z.string().trim().max(20, 'Nomor telepon maksimal 20 karakter.').optional(),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
})

export default defineEventHandler(async (event) => {
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw fail(422, parsed.error.issues[0]?.message ?? 'Data pendaftaran tidak valid.')
  }

  const { name, email, phone, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    throw fail(409, 'Email ini sudah terdaftar. Coba masuk saja.')
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
    },
    select: { id: true, email: true, name: true, role: true },
  })

  await setUserSession(event, { user })
  return user
})
