export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export function fail(status, code, message, extra) {
  throw new HttpError(status, code, message, extra)
}

export function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return
  const status = Number(error?.status) || 500
  if (status >= 500) {
    console.error(`[foundation] ${req.method} ${req.originalUrl} failed: ${error?.message || error}`)
  }
  res.status(status).json({
    ok: false,
    code: typeof error?.code === 'string' && /^[a-z0-9_]+$/.test(error.code) ? error.code : 'server_error',
    message: status >= 500 ? 'Unexpected server error.' : error.message || 'Request failed.',
    ...(error?.extra || {}),
  })
}
