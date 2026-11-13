import 'dotenv/config'
import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { EmailConfigError, getEmailStatus, sendProjectRequest } from './email.js'
import { askAssistant, plan, assistantMode } from './assistant.js'
import { validateSubmission } from './validate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 8787

const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX = 6
const DUPLICATE_TTL_MS = 24 * 60 * 60 * 1000

const rateHits = new Map()
const assistantHits = new Map()
const acceptedSubmissions = new Map()
const inFlight = new Set()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '96kb' }))

app.use((req, res, next) => {
  const started = Date.now()
  res.on('finish', () => {
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - started}ms)`)
    }
  })
  next()
})

function withinRateLimit(ip) {
  const now = Date.now()
  const recent = (rateHits.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX) {
    rateHits.set(ip, recent)
    return false
  }
  recent.push(now)
  rateHits.set(ip, recent)
  return true
}

const ASSISTANT_WINDOW_MS = 10 * 60 * 1000
const ASSISTANT_MAX = 45

function withinAssistantLimit(ip) {
  const now = Date.now()
  const recent = (assistantHits.get(ip) || []).filter((time) => now - time < ASSISTANT_WINDOW_MS)
  if (recent.length >= ASSISTANT_MAX) {
    assistantHits.set(ip, recent)
    return false
  }
  recent.push(now)
  assistantHits.set(ip, recent)
  return true
}

app.get('/api/health', (_req, res) => {
  const status = getEmailStatus()
  res.json({ ok: true, emailConfigured: status.configured, emailMode: status.mode, assistantMode: assistantMode() })
})

app.post('/api/assistant', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  if (!withinAssistantLimit(ip)) {
    return res.status(429).json({
      ok: false,
      code: 'rate_limited',
      message: 'That is a lot of messages in a short time. Please wait a moment and try again.',
    })
  }

  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : []
  const messages = rawMessages
    .filter((message) => message && typeof message.content === 'string' && message.content.trim())
    .slice(-12)
    .map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: message.content.trim().slice(0, 1200),
    }))

  if (!messages.length) {
    return res.status(400).json({
      ok: false,
      code: 'invalid_request',
      message: 'Send at least one message.',
    })
  }

  const draft = req.body?.draft && typeof req.body.draft === 'object' ? req.body.draft : {}
  const lastUser = [...messages].reverse().find((message) => message.role === 'user')
  if (!lastUser) {
    return res.status(400).json({ ok: false, code: 'invalid_request', message: 'No customer message found.' })
  }

  try {
    if (assistantMode() === 'ai') {
      try {
        const result = await askAssistant({ messages, draft })
        return res.json({ ok: true, ...result })
      } catch (error) {
        console.error(`[assistant] provider failed, using local planner: ${error?.message || error}`)
      }
    }
    const result = plan({ text: lastUser.content, draft })
    res.json({ ok: true, ...result })
  } catch (error) {
    console.error(`[assistant] failed: ${error?.message || error}`)
    res.status(500).json({
      ok: false,
      code: 'assistant_error',
      message: 'The assistant could not respond just now. You can keep using the builder manually.',
    })
  }
})

app.post('/api/project-request', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  if (!withinRateLimit(ip)) {
    return res.status(429).json({
      ok: false,
      code: 'rate_limited',
      message: 'Too many submission attempts. Please wait a few minutes and try again.',
    })
  }

  const { fields, data } = validateSubmission(req.body)
  if (Object.keys(fields).length) {
    return res.status(400).json({
      ok: false,
      code: 'invalid_request',
      message: 'Some required details are missing or invalid.',
      fields,
    })
  }

  const previous = acceptedSubmissions.get(data.submissionId)
  if (previous && Date.now() - previous < DUPLICATE_TTL_MS) {
    return res.json({ ok: true, duplicate: true, submissionId: data.submissionId })
  }

  if (inFlight.has(data.submissionId)) {
    return res.status(409).json({
      ok: false,
      code: 'duplicate_in_progress',
      message: 'This request is already being sent.',
    })
  }

  const status = getEmailStatus()
  if (!status.configured) {
    console.warn(`[project-request] email not configured: ${status.reason}`)
    return res.status(503).json({
      ok: false,
      code: 'email_not_configured',
      message: 'Email delivery is not configured on this server yet.',
    })
  }

  inFlight.add(data.submissionId)
  try {
    const result = await sendProjectRequest(data)
    acceptedSubmissions.set(data.submissionId, Date.now())
    console.log(`[project-request] sent ${data.submissionId} (${result.messageId})`)
    res.json({ ok: true, submissionId: data.submissionId })
  } catch (error) {
    const reason = error?.message || 'unknown error'
    console.error(`[project-request] failed ${data.submissionId}: ${reason}`)
    if (error instanceof EmailConfigError) {
      return res.status(503).json({
        ok: false,
        code: 'email_not_configured',
        message: 'Email delivery is not configured on this server yet.',
      })
    }
    res.status(502).json({
      ok: false,
      code: 'delivery_failed',
      message: 'The email could not be delivered right now.',
    })
  } finally {
    inFlight.delete(data.submissionId)
  }
})

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, code: 'not_found', message: 'Unknown API endpoint.' })
})

const dist = path.resolve(__dirname, '../dist')
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next()
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, code: 'invalid_json', message: 'Request body is not valid JSON.' })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, code: 'payload_too_large', message: 'Request body is too large.' })
  }
  console.error('[server] unhandled error:', error?.message || error)
  res.status(500).json({ ok: false, code: 'server_error', message: 'Unexpected server error.' })
})

app.listen(PORT, '0.0.0.0', () => {
  const status = getEmailStatus()
  console.log(`BRIX Studio server listening on http://localhost:${PORT}`)
  console.log(
    status.configured
      ? `Email delivery: configured (${status.mode === 'gmail_api' ? 'Gmail API via OAuth 2.0' : 'Gmail SMTP app password'})`
      : `Email delivery: NOT configured — ${status.reason}`,
  )
  console.log(
    assistantMode() === 'ai'
      ? 'Assistant: AI provider configured'
      : 'Assistant: built-in planner (set ASSISTANT_API_KEY for AI mode)',
  )
})
