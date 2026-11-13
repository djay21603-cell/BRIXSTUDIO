import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  STUDIO_EMAIL,
  getEmailStatus,
  sendContactNotification,
  sendCustomerConfirmation,
  sendProjectRequest,
} from '../email.js'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

let api
let requests
let tmp
let attachmentPath

function startApiServer() {
  const captured = []
  const server = createServer((req, res) => {
    let raw = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      const entry = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: JSON.parse(raw || '{}'),
      }
      captured.push(entry)
      if (entry.headers['api-key'] !== 'brevo-test-key') {
        res.writeHead(401, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ code: 'unauthorized', message: 'bad key' }))
        return
      }
      res.writeHead(201, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ messageId: `<brevo-${captured.length}@test>` }))
    })
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, captured, port: server.address().port }))
  })
}

const contactData = {
  submissionId: 'email-brevo-test-001',
  submittedAt: new Date().toISOString(),
  source: 'contact',
  contact: { name: 'Ada Owner', email: 'ada@example.com', phone: '0917 000 0000', location: 'Cebu' },
  business: {
    name: 'Meridian Hotel',
    tagline: 'A quiet stay in the city',
    category: 'Hotel',
    description: 'Boutique hotel with 24 rooms.',
    existingUrl: '',
  },
  message: 'We need a new website for the hotel.',
}

const projectData = {
  ...contactData,
  submissionId: 'email-brevo-test-002',
  design: { template: 'Meridian', style: 'Editorial' },
  brand: { primary: '#386bff', accent: '#8157f5', typography: 'Instrument Serif' },
  pages: ['Home', 'Rooms'],
  features: ['Booking'],
  channels: ['Email'],
  motion: 'Subtle',
  assetLinks: '',
}

before(async () => {
  api = await startApiServer()
  requests = api.captured
  process.env.BREVO_API_KEY = 'brevo-test-key'
  process.env.BREVO_API_URL = `http://127.0.0.1:${api.port}/v3/smtp/email`
  process.env.MAIL_FROM = '"BRIX Studio" <studio@example.com>'
  delete process.env.BREVO_SENDER
  delete process.env.SMTP_HOST
  delete process.env.GMAIL_USER
  delete process.env.GMAIL_APP_PASSWORD

  tmp = await mkdtemp(path.join(tmpdir(), 'brix-brevo-'))
  attachmentPath = path.join(tmp, 'logo.png')
  await writeFile(attachmentPath, PNG)
})

after(async () => {
  if (api?.server) await new Promise((resolve) => api.server.close(resolve))
  delete process.env.BREVO_API_KEY
  delete process.env.BREVO_API_URL
  delete process.env.MAIL_FROM
  if (tmp) await rm(tmp, { recursive: true, force: true }).catch(() => {})
})

test('email delivery over the Brevo HTTPS API', async (t) => {
  await t.test('status reports the Brevo configuration', () => {
    const status = getEmailStatus()
    assert.equal(status.configured, true)
    assert.equal(status.mode, 'brevo')
    assert.equal(status.recipient, STUDIO_EMAIL)
  })

  await t.test('studio notification is posted to the Brevo API', async () => {
    const result = await sendContactNotification(contactData)
    assert.equal(result.transport, 'brevo')
    assert.equal(requests.length, 1)
    const request = requests[0]
    assert.equal(request.method, 'POST')
    assert.equal(request.headers['api-key'], 'brevo-test-key')
    assert.equal(request.body.sender.email, 'studio@example.com')
    assert.equal(request.body.sender.name, 'BRIX Studio')
    assert.equal(request.body.to[0].email, STUDIO_EMAIL)
    assert.match(request.body.subject, /New website inquiry/)
    assert.match(request.body.htmlContent, /Meridian Hotel/)
    assert.match(request.body.textContent, /Reference: email-brevo-test-001/)
    assert.equal(request.body.replyTo.email, 'ada@example.com')
  })

  await t.test('customer confirmation is posted to the customer address', async () => {
    await sendCustomerConfirmation(contactData)
    const request = requests.at(-1)
    assert.equal(request.body.to[0].email, 'ada@example.com')
    assert.match(request.body.subject, /We received your message/)
  })

  await t.test('attachments are base64 encoded into the payload', async () => {
    await sendProjectRequest(projectData, {
      uploads: [{ name: 'logo.png', mime: 'image/png', size: PNG.length, path: attachmentPath }],
    })
    const request = requests.at(-1)
    assert.equal(request.body.attachment.length, 1)
    assert.equal(request.body.attachment[0].name, 'logo.png')
    assert.equal(request.body.attachment[0].content, PNG.toString('base64'))
  })

  await t.test('API rejections surface as delivery errors', async () => {
    process.env.BREVO_API_KEY = 'wrong-key'
    await assert.rejects(
      () => sendContactNotification(contactData),
      /Brevo rejected the message \(401/,
    )
    process.env.BREVO_API_KEY = 'brevo-test-key'
  })
})
