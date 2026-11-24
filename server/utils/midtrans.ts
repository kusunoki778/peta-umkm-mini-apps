import { createHash, timingSafeEqual } from 'node:crypto'

const SANDBOX = 'https://app.sandbox.midtrans.com/snap/v1/transactions'
const PRODUCTION = 'https://app.midtrans.com/snap/v1/transactions'

interface MidtransErrorBody {
  error_messages?: string[]
  status_message?: string
}

export async function createSnapToken(input: {
  orderId: string
  amount: number
  customer: { name: string; email: string; phone?: string | null }
}) {
  const config = useRuntimeConfig()
  const serverKey = String(config.midtransServerKey ?? '')
  const clientKey = String(config.public.midtransClientKey ?? '')
  if (!serverKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Pembayaran belum dikonfigurasi.',
      data: { message: 'Server key Midtrans belum diisi.' },
    })
  }
  if (!clientKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Pembayaran belum dikonfigurasi.',
      data: { message: 'Client key Midtrans belum diisi.' },
    })
  }

  const auth = Buffer.from(`${serverKey}:`).toString('base64')
  try {
    const response = await $fetch<{ token: string }>(
      config.public.midtransIsProduction ? PRODUCTION : SANDBOX,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          transaction_details: { order_id: input.orderId, gross_amount: input.amount },
          customer_details: {
            first_name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone ?? undefined,
          },
        },
      },
    )
    return response.token
  } catch (error) {
    // Midtrans mengembalikan body seperti { error_messages: [...], status_message: "..." }.
    // Tanpa ini, pengguna hanya melihat 500 generik dan penyebabnya tidak pernah sampai ke UI.
    const body = (error as { data?: MidtransErrorBody })?.data
    const detail =
      body?.error_messages?.join(' ') ||
      body?.status_message ||
      (error instanceof Error ? error.message : '')
    throw createError({
      statusCode: 502,
      statusMessage: 'Midtrans menolak permintaan pembayaran.',
      data: {
        message: detail
          ? `Midtrans menolak permintaan pembayaran: ${detail}`
          : 'Midtrans menolak permintaan pembayaran. Periksa kunci API dan izin Snap.',
      },
    })
  }
}

export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signature: string,
) {
  const config = useRuntimeConfig()
  const expected = createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${config.midtransServerKey}`)
    .digest('hex')
  const actual = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actual.length === expectedBuffer.length && timingSafeEqual(expectedBuffer, actual)
}
