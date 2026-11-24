import { verifyMidtransSignature } from '../../utils/midtrans'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async event => {
  const body = await readBody<Record<string, string>>(event)
  const grossAmount = String(body.gross_amount ?? '')
  const signatureValid =
    body.order_id && body.status_code && body.signature_key
      ? verifyMidtransSignature(body.order_id, body.status_code, grossAmount, body.signature_key)
      : false
  if (!signatureValid) {
    throw createError({ statusCode: 401, statusMessage: 'Signature pembayaran tidak valid.' })
  }
  const payment = await prisma.payment.findUnique({
    where: { orderId: body.order_id },
    include: { boost: { include: { package: true } } },
  })
  if (!payment) throw createError({ statusCode: 404, statusMessage: 'Order tidak ditemukan.' })
  const transactionStatus = body.transaction_status ?? ''
  const settled = transactionStatus === 'settlement' || transactionStatus === 'capture'
  const failed = ['deny', 'cancel', 'expire'].includes(transactionStatus)
  if (settled && payment.status !== 'settled') {
    const now = new Date()
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'settled', method: body.payment_type, paidAt: now, rawResponse: body },
      }),
      prisma.boost.update({
        where: { id: payment.boostId },
        data: {
          status: 'active',
          startsAt: now,
          endsAt: new Date(now.getTime() + payment.boost.package.durationDays * 86400000),
        },
      }),
    ])
  } else if (failed && payment.status === 'pending') {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: transactionStatus === 'expire' ? 'expired' : 'failed', rawResponse: body },
      }),
      prisma.boost.update({ where: { id: payment.boostId }, data: { status: 'failed' } }),
    ])
  }
  return { ok: true }
})
