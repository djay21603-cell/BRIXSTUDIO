import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  EmailConfigError,
  getEmailStatus,
  sendContactNotification,
  sendCustomerConfirmation,
  sendProjectRequest,
} from '../email.js'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

let smtp
let messages
let tmp
let attachmentPath

function startSmtpServer() {
  const received = []
  const server = createServer((socket) => {
    socket.setEncoding('utf8')
    socket.write('220 127.0.0.1 ESMTP test\r\n')
    let buffer = ''
    let inData = false
    let data = ''
    let recipient = ''
    let authStage = 0

    socket.on('data', (chunk) => {
      buffer += chunk
      let index
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index)
        buffer = buffer.slice(index + 2)

        if (inData) {
          if (line === '.') {
            inData = false
            received.push({ to: recipient, raw: data })
            data = ''
            recipient = ''
            socket.write('250 2.0.0 queued\r\n')
          } else {
            data += `${line}\r\n`
          }
          continue
        }

        const upper = line.toUpperCase()
        if (authStage === 1) {
          authStage = 2
          socket.write('334 UGFzc3dvcmQ6\r\n')
        } else if (authStage === 2) {
          authStage = 0
          socket.write('235 2.7.0 authenticated\r\n')
        } else if (upper.startsWith('EHLO')) {
          socket.write('250-127.0.0.1\r\n')
          socket.write('250 AUTH PLAIN LOGIN\r\n')
        } else if (upper.startsWith('HELO')) {
          socket.write('250 127.0.0.1\r\n')
        } else if (upper.startsWith('AUTH PLAIN')) {
          socket.write('235 2.7.0 authenticated\r\n')
        } else if (upper === 'AUTH LOGIN') {
          authStage = 1
          socket.write('334 VXNlcm5hbWU6\r\n')
        } else if (upper.startsWith('MAIL FROM')) {
          socket.write('250 2.1.0 ok\r\n')
        } else if (upper.startsWith('RCPT TO')) {
          const match = line.match(/<([^>]+)>/)
          recipient = match ? match[1] : ''
          socket.write('250 2.1.5 ok\r\n')
        } else if (upper === 'DATA') {
          inData = true
          socket.write('354 end with .\r\n')
        } else if (upper === 'QUIT') {
          socket.write('221 2.0.0 bye\r\n')
          socket.end()
        } else {
          socket.write('250 2.0.0 ok\r\n')
        }
      }
    })
    socket.on('error', () => {})
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, received, port: server.address().port }))
  })
}

const projectData = {
  submissionId: 'email-test-brief-001',
  submittedAt: new Date().toISOString(),
  contact: { name: 'Ada Owner', email: 'ada@example.com', phone: '0917 000 0000', location: 'Cebu' },
  business: {
    name: 'Meridian Hotel',
    tagline: 'A quiet stay in the city',
    category: 'Hotel',
    description: 'Boutique hotel with 24 rooms.',
    existingUrl: '',
  },
  design: { template: 'Meridian', style: 'Editorial' },
  brand: { primary: '#386bff', accent: '#8157f5', typography: 'Instrument Serif' },
  pages: ['Home', 'Rooms'],
  features: ['Booking'],
  channels: ['Email'],
  motion: 'Subtle',
  assetLinks: '',
  assets: [],
}

before(async () => {
  smtp = await startSmtpServer()
  messages = smtp.received
  process.env.SMTP_HOST = '127.0.0.1'
  process.env.SMTP_PORT = String(smtp.port)
  process.env.SMTP_SECURE = 'false'
  process.env.SMTP_USER = 'studio@example.com'
  process.env.SMTP_PASS = 'test-app-password'
  process.env.MAIL_FROM = '"BRIX Studio" <studio@example.com>'
  delete process.env.GMAIL_USER
  delete process.env.BREVO_API_KEY
  delete process.env.BREVO_API_URL
  delete process.env.BREVO_SENDER

  tmp = await mkdtemp(path.join(tmpdir(), 'brix-email-'))
  attachmentPath = path.join(tmp, 'logo.png')
  await writeFile(attachmentPath, PNG)
})

after(async () => {
  smtp?.server.closeAllConnections?.()
  if (smtp?.server) await new Promise((resolve) => smtp.server.close(resolve))
  delete process.env.SMTP_HOST
  delete process.env.SMTP_PORT
  delete process.env.SMTP_SECURE
  delete process.env.SMTP_USER
  delete process.env.SMTP_PASS
  delete process.env.MAIL_FROM
  if (tmp) await rm(tmp, { recursive: true, force: true }).catch(() => {})
})

test('email delivery over SMTP', async (t) => {
  await t.test('status reports the custom SMTP configuration', () => {
    const status = getEmailStatus()
    assert.equal(status.configured, true)
    assert.equal(status.mode, 'smtp')
    assert.equal(status.recipient, 'mendozafabillar@gmail.com')
  })

  await t.test('studio notification includes the brief and attachments', async () => {
    const result = await sendProjectRequest(projectData, {
      uploads: [{ name: 'logo.png', mime: 'image/png', size: PNG.length, path: attachmentPath }],
    })
    assert.equal(result.transport, 'smtp')
    assert.equal(messages.length, 1)
    assert.equal(messages[0].to, 'mendozafabillar@gmail.com')
    const raw = messages[0].raw
    assert.match(raw, /To: mendozafabillar@gmail\.com/i)
    assert.match(raw, /Subject:.*New_project_request/i)
    assert.match(raw, /Attached files: logo\.png/)
    assert.match(raw, /BRIX STUDIO/)
    assert.equal(raw.includes('>CS</span>'), false)
    assert.match(raw.toLowerCase(), /filename=logo\.png/i)
  })

  await t.test('customer receives an automatic confirmation', async () => {
    const result = await sendCustomerConfirmation(projectData)
    assert.equal(result.transport, 'smtp')
    assert.equal(messages.length, 2)
    assert.equal(messages[1].to, 'ada@example.com')
    assert.match(messages[1].raw, /To: ada@example\.com/i)
    assert.match(messages[1].raw, /We_received_your_project_request/i)
    assert.match(messages[1].raw, /No payment is collected/i)
  })

  await t.test('contact inquiries notify the studio and confirm to the sender', async () => {
    const contact = {
      ...projectData,
      submissionId: 'email-test-contact-001',
      source: 'contact',
      message: 'We need a new site for a small hotel with online booking.',
      business: { ...projectData.business, name: 'Not provided', category: '', description: '' },
      design: { template: 'Not selected', style: '' },
      pages: [],
      features: [],
    }

    await sendContactNotification(contact)
    assert.equal(messages.length, 3)
    assert.equal(messages[2].to, 'mendozafabillar@gmail.com')
    assert.match(messages[2].raw, /New_website_inquiry/i)
    assert.match(messages[2].raw, /We need a new site/)

    await sendCustomerConfirmation(contact)
    assert.equal(messages.length, 4)
    assert.equal(messages[3].to, 'ada@example.com')
    assert.match(messages[3].raw, /We_received_your_message/i)
  })

  await t.test('missing SMTP credentials raise a configuration error', async () => {
    const host = process.env.SMTP_HOST
    const user = process.env.SMTP_USER
    delete process.env.SMTP_HOST
    delete process.env.GMAIL_USER
    try {
      await assert.rejects(() => sendProjectRequest(projectData), EmailConfigError)
    } finally {
      process.env.SMTP_HOST = host
      process.env.SMTP_USER = user
    }
  })
})
