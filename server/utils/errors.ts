/**
 * Error HTTP dengan bentuk data yang seragam, supaya form di klien bisa
 * menampilkan pesan yang sama tanpa menebak-nebak isi respons.
 */
export function fail(statusCode: number, message: string, issues?: unknown) {
  return createError({
    statusCode,
    statusMessage: message,
    data: { message, issues },
  })
}
