import crypto from 'node:crypto'
import fs from 'node:fs'

const env = fs.readFileSync('.env', 'utf8')
const key =
  env
    .match(/^MIDTRANS_SERVER_KEY=(.*)$/m)?.[1]
    ?.trim()
    .replace(/^"|"$/g, '') ?? ''
const orderId = 'seed-cmwszlvfn001j3gvhpvyodovm'
const body = {
  order_id: orderId,
  status_code: '200',
  gross_amount: '25000',
  transaction_status: 'settlement',
  payment_type: 'qris',
}
body.signature_key = crypto
  .createHash('sha512')
  .update(orderId + body.status_code + body.gross_amount + key)
  .digest('hex')

const call = () =>
  fetch('http://127.0.0.1:3111/api/payments/notification', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
const first = await call()
const second = await call()
console.log('valid pertama', first.status, await first.text())
console.log('valid kedua', second.status, await second.text())
process.exit(first.status === 200 && second.status === 200 ? 0 : 1)
