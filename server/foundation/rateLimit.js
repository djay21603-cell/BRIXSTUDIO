export function consumeRateLimit(db, { key, limit, windowMs }) {
  const now = Date.now()
  const row = db.prepare('SELECT count, expires_at FROM rate_limits WHERE key = ?').get(key)

  if (!row || Number(row.expires_at) <= now) {
    db.prepare(
      `INSERT INTO rate_limits (key, count, window_start, expires_at) VALUES (?, 1, ?, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start, expires_at = excluded.expires_at`,
    ).run(key, now, now + windowMs)
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterMs: 0 }
  }

  if (Number(row.count) >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, Number(row.expires_at) - now) }
  }

  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key)
  return { ok: true, remaining: Math.max(0, limit - Number(row.count) - 1), retryAfterMs: 0 }
}

export function rateLimit(db, { bucket, limit, windowMs, by = 'ip' }) {
  return (req, res, next) => {
    const subject =
      by === 'user' ? req.user?.id : by === 'email' ? String(req.body?.email || '').trim().toLowerCase() : req.ip
    const key = `${bucket}:${subject || 'anonymous'}`
    const result = consumeRateLimit(db, { key, limit, windowMs })
    if (!result.ok) {
      res.set('Retry-After', String(Math.ceil(result.retryAfterMs / 1000)))
      return res.status(429).json({
        ok: false,
        code: 'rate_limited',
        message: 'Too many attempts. Please wait a moment and try again.',
      })
    }
    next()
  }
}
