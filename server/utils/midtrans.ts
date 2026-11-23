import { createHash, timingSafeEqual } from 'node:crypto'

const SANDBOX = 'https://app.sandbox.midtrans.com/snap/v1/token'
const PRODUCTION = 'https://app.midtrans.com/snap/v1/token'

export async function createSnapToken(input: {
  orderId: string
  amount: number
  customer: { name: string, email: string, phone?: string | null }
}) {
  const config = useRuntimeConfig()
  if (!config.midtransServerKey) throw createError({ statusCode: 503, statusMessage: 'Pembayaran belum dikonfigurasi.' })
  const auth = Buffer.from(`${config.midtransServerKey}:`).toString('base64')
  const response = await $fetch<{ token: string }>(config.public.midtransIsProduction ? PRODUCTION : SANDBOX, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: {
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      customer_details: { first_name: input.customer.name, email: input.customer.email, phone: input.customer.phone ?? undefined },
    },
  })
  return response.token
}

export function verifyMidtransSignature(orderId: string, statusCode: string, grossAmount: string, signature: string) {
  const config = useRuntimeConfig()
  const expected = createHash('sha512').update(`${orderId}${statusCode}${grossAmount}${config.midtransServerKey}`).digest('hex')
  const actual = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actual.length === expectedBuffer.length && timingSafeEqual(expectedBuffer, actual)
}
