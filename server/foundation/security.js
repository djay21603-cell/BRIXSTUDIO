export function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(self), geolocation=()',
    'Cross-Origin-Resource-Policy': 'same-origin',
  })
  if (req.secure || req.get('x-forwarded-proto') === 'https') {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
  }
  next()
}

export function noStoreApi(req, res, next) {
  if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store')
  next()
}
