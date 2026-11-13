import nodemailer from 'nodemailer'

/** The destination is fixed server-side so the browser can never redirect project requests. */
export const STUDIO_EMAIL = 'mendozafabillar@gmail.com'
export const STUDIO_NAME = 'BRIX Studio'

export class EmailConfigError extends Error {}

let cachedTransport = null
let tokenCache = null

function positiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function parseBool(value, fallback) {
  if (value === undefined || value === '') return fallback
  return !['false', '0', 'no', 'off'].includes(String(value).trim().toLowerCase())
}

function addressFrom(value) {
  const match = String(value || '').match(/<([^>]+)>/)
  return (match ? match[1] : String(value || '')).trim()
}

function readConfig() {
  const configuredSender = (process.env.MAIL_FROM || '').trim()
  const smtpHost = (process.env.SMTP_HOST || '').trim()

  if (smtpHost) {
    const secure = parseBool(process.env.SMTP_SECURE, positiveInt(process.env.SMTP_PORT, 0) === 465)
    const port = positiveInt(process.env.SMTP_PORT, secure ? 465 : 587)
    const user = (process.env.SMTP_USER || '').trim()
    const pass = process.env.SMTP_PASS || ''
    if (!user || !pass) {
      return { configured: false, reason: 'SMTP_HOST is set but SMTP_USER or SMTP_PASS is missing.' }
    }
    return {
      configured: true,
      mode: 'smtp',
      host: smtpHost,
      port,
      secure,
      auth: { user, pass },
      sender: configuredSender || `"${STUDIO_NAME}" <${user}>`,
      address: addressFrom(configuredSender) || user,
    }
  }

  const user = (process.env.GMAIL_USER || '').trim()
  const appPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
  const clientId = (process.env.GMAIL_CLIENT_ID || '').trim()
  const clientSecret = (process.env.GMAIL_CLIENT_SECRET || '').trim()
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim()

  if (!user) {
    return { configured: false, reason: 'Set SMTP_HOST / SMTP_USER / SMTP_PASS, or GMAIL_USER with an app password.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
    return { configured: false, reason: 'GMAIL_USER is not a valid email address.' }
  }

  const sender = configuredSender || `"${STUDIO_NAME}" <${user}>`
  const address = addressFrom(configuredSender) || user

  if (appPassword) {
    return {
      configured: true,
      user,
      mode: 'smtp',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass: appPassword },
      sender,
      address,
    }
  }

  if (clientId && clientSecret && refreshToken) {
    return { configured: true, user, mode: 'gmail_api', clientId, clientSecret, refreshToken, sender, address }
  }

  return {
    configured: false,
    reason: 'Set GMAIL_APP_PASSWORD, or all three GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET / GMAIL_REFRESH_TOKEN values.',
  }
}

export function getEmailStatus() {
  const config = readConfig()
  return {
    configured: config.configured,
    mode: config.configured ? config.mode : null,
    reason: config.configured ? null : config.reason,
    recipient: STUDIO_EMAIL,
  }
}

/* ---- Gmail API (OAuth 2.0 refresh token) ---- */

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function accessTokenFor(config) {
  const key = `${config.user}:${config.clientId}`
  if (tokenCache && tokenCache.key === key && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.token
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: 'refresh_token',
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description || payload.error || response.statusText
    throw new Error(`Gmail OAuth token exchange failed (${response.status}: ${detail})`)
  }

  const expiresAt = Date.now() + (Number(payload.expires_in) || 3600) * 1000
  tokenCache = { key, token: payload.access_token, expiresAt }
  return payload.access_token
}

async function sendViaGmailApi(config, mail) {
  /* Nodemailer builds the RFC 5322 message; Gmail only needs it base64url encoded. */
  const streamer = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
  const { message } = await streamer.sendMail(mail)
  if (!message) throw new Error('Could not assemble the email message.')

  let token = await accessTokenFor(config)
  const send = () =>
    fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: base64Url(message) }),
      signal: AbortSignal.timeout(20_000),
    })

  let response = await send()
  if (response.status === 401) {
    tokenCache = null
    token = await accessTokenFor(config)
    response = await send()
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = payload?.error?.message || response.statusText
    throw new Error(`Gmail API rejected the message (${response.status}: ${detail})`)
  }

  return { messageId: payload.id || payload.threadId }
}

function transportFor(config) {
  const key = `${config.mode}:${config.host}:${config.port}:${config.auth?.user}`
  if (cachedTransport && cachedTransport.key === key) return cachedTransport.transport
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  })
  cachedTransport = { key, transport }
  return transport
}

async function deliver(config, mail, expectedRecipient) {
  if (config.mode === 'gmail_api') {
    const info = await sendViaGmailApi(config, mail)
    return { messageId: info.messageId || null, transport: 'gmail_api' }
  }

  const transport = transportFor(config)
  const info = await transport.sendMail(mail)
  const accepted = Array.isArray(info.accepted) ? info.accepted.map((address) => String(address).toLowerCase()) : []
  if (expectedRecipient && !accepted.includes(expectedRecipient.toLowerCase())) {
    throw new Error(`SMTP server did not accept ${expectedRecipient} (accepted: ${accepted.join(', ') || 'none'})`)
  }
  return { messageId: info.messageId || null, transport: 'smtp' }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatBytes(bytes) {
  if (!bytes) return 'size unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readableTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const formatted = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date)
  return `${formatted} UTC`
}

function joinOr(value, fallback) {
  return value && value.length ? value.join(', ') : fallback
}

function section(title, rows) {
  return `
    <tr>
      <td style="padding:22px 0 0;">
        <p style="margin:0 0 10px;font:700 11px/1.4 Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#22d3ee;">${escapeHtml(title)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${rows}
        </table>
      </td>
    </tr>`
}

function row(label, value, mono = false) {
  return `
    <tr>
      <td style="padding:7px 16px 7px 0;vertical-align:top;width:150px;font:400 12px/1.6 Arial,sans-serif;color:#a3aec2;">${escapeHtml(label)}</td>
      <td style="padding:7px 0;vertical-align:top;font:${mono ? '500 12px/1.6 Consolas,monospace' : '500 13px/1.6 Arial,sans-serif'};color:#f4f7ff;">${escapeHtml(value)}</td>
    </tr>`
}

function swatchRow(brand) {
  const chip = (hex) => `
    <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:${hex};border:1px solid #2b3a5c;vertical-align:-2px;margin-right:8px;"></span>
    <span style="font:500 12px/1.6 Consolas,monospace;color:#f4f7ff;">${hex.toUpperCase()}</span>`
  return `
    <tr>
      <td style="padding:7px 16px 7px 0;vertical-align:top;width:150px;font:400 12px/1.6 Arial,sans-serif;color:#a3aec2;">Brand colours</td>
      <td style="padding:7px 0;vertical-align:top;font:500 13px/1.6 Arial,sans-serif;color:#f4f7ff;">
        ${chip(brand.primary)}&nbsp;&nbsp;&nbsp;${chip(brand.accent)}
      </td>
    </tr>`
}

function attachmentNote(uploads) {
  if (!uploads.length) return 'None attached'
  return uploads.map((upload) => `${upload.name} (${formatBytes(upload.size)})`).join('\n')
}

function attachmentList(uploads) {
  return uploads
    .filter((upload) => upload?.path)
    .map((upload) => ({ filename: upload.name, path: upload.path, contentType: upload.mime }))
}

function shell({ headline, subline, timestamp, body }) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#080d19;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080d19;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#151f35;border:1px solid #24314d;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:26px 28px;background:#111b30;border-bottom:1px solid #24314d;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="display:inline-block;padding:8px 10px;border-radius:10px;background:#386bff;font:700 12px/1 Arial,sans-serif;letter-spacing:0.04em;color:#ffffff;">BS</span>
                      <span style="font:700 13px/1 Arial,sans-serif;letter-spacing:0.22em;color:#f4f7ff;margin-left:12px;">BRIX&nbsp;STUDIO</span>
                      <p style="margin:14px 0 0;font:400 12px/1.6 Arial,sans-serif;color:#a3aec2;">${escapeHtml(subline)}</p>
                    </td>
                    <td align="right" style="font:400 11px/1.6 Arial,sans-serif;color:#a3aec2;">
                      ${escapeHtml(readableTime(timestamp))}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="height:3px;background:#386bff;background-image:linear-gradient(90deg,#386bff,#8157f5);"></td>
            </tr>
            <tr>
              <td style="padding:6px 28px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:22px 0 0;">
                      <h1 style="margin:0;font:600 24px/1.3 Georgia,serif;color:#f4f7ff;">${escapeHtml(headline)}</h1>
                    </td>
                  </tr>
                  ${body}
                </table>
                <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #24314d;font:400 11px/1.7 Arial,sans-serif;color:#a3aec2;">
                  Sent by BRIX Studio. Never send card or bank details by email — the studio will not request payment in a confirmation message.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/* ---- Studio notification: project brief ---- */

function buildProjectHtml(data, uploads) {
  return shell({
    headline: data.business.name === 'Not provided' ? 'New website project request' : data.business.name,
    subline: 'New project request from the website builder',
    timestamp: data.submittedAt,
    body: [
      section(
        'Contact',
        [
          row('Full name', data.contact.name),
          row('Email', data.contact.email),
          row('Phone', data.contact.phone || 'Not provided'),
          row('Location', data.contact.location || 'Not provided'),
        ].join(''),
      ),
      section(
        'Business',
        [row('Business type', data.business.category), row('Existing website', data.business.existingUrl || 'None')].join(''),
      ),
      section(
        'Design & scope',
        [
          row('Template', data.design.template),
          row('Style', data.design.style || 'Not specified'),
          row('Pages', joinOr(data.pages, 'None selected')),
          row('Features', joinOr(data.features, 'None selected')),
          row('Communication', joinOr(data.channels, 'None selected')),
          row('Animation', data.motion),
        ].join(''),
      ),
      section('Brand', [swatchRow(data.brand), row('Typography', data.brand.typography)].join('')),
      section('About the business', [row('Description', data.business.description || 'Not provided')].join('')),
      section(
        'Assets',
        [...(data.assetLinks ? [row('Links', data.assetLinks)] : []), row('Attached files', attachmentNote(uploads))].join(''),
      ),
      section('Submission', [row('Reference', data.submissionId, true)].join('')),
    ].join(''),
  })
}

function buildProjectText(data, uploads) {
  return [
    'BRIX STUDIO — new project request',
    `Submitted: ${readableTime(data.submittedAt)}`,
    '',
    `Business: ${data.business.name}`,
    `Tagline: ${data.business.tagline || '—'}`,
    `Business type: ${data.business.category}`,
    `Existing website: ${data.business.existingUrl || 'None'}`,
    '',
    'Contact',
    `Name: ${data.contact.name}`,
    `Email: ${data.contact.email}`,
    `Phone: ${data.contact.phone || '—'}`,
    `Location: ${data.contact.location || '—'}`,
    '',
    'Design & scope',
    `Template: ${data.design.template}${data.design.style ? ` (${data.design.style})` : ''}`,
    `Pages: ${joinOr(data.pages, 'None selected')}`,
    `Features: ${joinOr(data.features, 'None selected')}`,
    `Communication: ${joinOr(data.channels, 'None selected')}`,
    `Animation: ${data.motion}`,
    `Primary colour: ${data.brand.primary}`,
    `Accent colour: ${data.brand.accent}`,
    `Typography: ${data.brand.typography}`,
    '',
    'About the business',
    data.business.description || '—',
    '',
    'Assets',
    data.assetLinks ? `Links: ${data.assetLinks}` : 'Links: —',
    `Attached files: ${attachmentNote(uploads)}`,
    '',
    `Reference: ${data.submissionId}`,
    '',
    `Reply to this email to reach ${data.contact.name}.`,
  ].join('\n')
}

/* ---- Studio notification: short contact message ---- */

function buildContactHtml(data) {
  return shell({
    headline: data.business.name === 'Not provided' ? `New inquiry from ${data.contact.name}` : data.business.name,
    subline: 'New website inquiry from the contact form',
    timestamp: data.submittedAt,
    body: [
      section(
        'Contact',
        [
          row('Full name', data.contact.name),
          row('Email', data.contact.email),
          row('Phone', data.contact.phone || 'Not provided'),
          row('Business', data.business.name),
        ].join(''),
      ),
      section('Message', [row('Message', data.message)].join('')),
      section('Submission', [row('Reference', data.submissionId, true)].join('')),
    ].join(''),
  })
}

function buildContactText(data) {
  return [
    'BRIX STUDIO — new website inquiry',
    `Submitted: ${readableTime(data.submittedAt)}`,
    '',
    `Name: ${data.contact.name}`,
    `Email: ${data.contact.email}`,
    `Phone: ${data.contact.phone || '—'}`,
    `Business: ${data.business.name}`,
    '',
    'Message',
    data.message,
    '',
    `Reference: ${data.submissionId}`,
    '',
    `Reply to this email to reach ${data.contact.name}.`,
  ].join('\n')
}

/* ---- Customer confirmation ---- */

function nextSteps() {
  return [
    row('1', 'We review your details and the files you attached.'),
    row('2', 'We reply by email with follow-up questions or a written quotation.'),
    row('3', 'No payment is collected from this confirmation email.'),
  ].join('')
}

function buildConfirmationHtml(data) {
  const isContact = data.source === 'contact'
  const received = isContact
    ? [row('Name', data.contact.name), row('Email', data.contact.email), row('Message', data.message)]
    : [
        row('Business', data.business.name),
        row('Contact', data.contact.name),
        row('Design', data.design.template),
        row('Pages', joinOr(data.pages, 'None selected')),
        row('Features', joinOr(data.features, 'None selected')),
      ]
  return shell({
    headline: isContact ? 'We received your message.' : 'We received your project request.',
    subline: 'Automatic confirmation from BRIX Studio',
    timestamp: data.submittedAt,
    body: [
      `<tr><td style="padding:14px 0 0;"><p style="margin:0;font:400 14px/1.7 Arial,sans-serif;color:#c7d2e6;">Thanks, ${escapeHtml(data.contact.name)}. Your details reached the studio. Here is a copy for your records.</p></td></tr>`,
      section(isContact ? 'Your message' : 'Your request', received.join('')),
      section('What happens next', nextSteps()),
      section('Your reference', [row('Reference', data.submissionId, true)].join('')),
    ].join(''),
  })
}

function buildConfirmationText(data) {
  const isContact = data.source === 'contact'
  return [
    `BRIX STUDIO — we received your ${isContact ? 'message' : 'project request'}`,
    `Submitted: ${readableTime(data.submittedAt)}`,
    '',
    `Thanks, ${data.contact.name}. Your details reached the studio.`,
    '',
    isContact ? 'Your message' : 'Your request',
    ...(isContact
      ? [`Name: ${data.contact.name}`, `Email: ${data.contact.email}`, data.message]
      : [
          `Business: ${data.business.name}`,
          `Design: ${data.design.template}`,
          `Pages: ${joinOr(data.pages, 'None selected')}`,
          `Features: ${joinOr(data.features, 'None selected')}`,
        ]),
    '',
    'What happens next',
    '1. We review your details and any attached files.',
    '2. We reply by email with follow-up questions or a written quotation.',
    '3. No payment is collected from this confirmation email.',
    '',
    `Reference: ${data.submissionId}`,
    '',
    'BRIX Studio',
  ].join('\n')
}

/* ---- Public senders ---- */

export async function sendProjectRequest(data, { uploads = [] } = {}) {
  const config = readConfig()
  if (!config.configured) throw new EmailConfigError(config.reason)

  const business = data.business.name === 'Not provided' ? 'New website project' : data.business.name
  const mail = {
    from: config.sender,
    to: STUDIO_EMAIL,
    replyTo: { name: data.contact.name, address: data.contact.email },
    subject: `New project request — ${business} (${data.business.category})`,
    text: buildProjectText(data, uploads),
    html: buildProjectHtml(data, uploads),
    headers: { 'X-Project-Request-Id': data.submissionId },
    attachments: attachmentList(uploads),
  }

  return deliver(config, mail, STUDIO_EMAIL)
}

export async function sendContactNotification(data) {
  const config = readConfig()
  if (!config.configured) throw new EmailConfigError(config.reason)

  const label = data.business.name === 'Not provided' ? data.contact.name : data.business.name
  const mail = {
    from: config.sender,
    to: STUDIO_EMAIL,
    replyTo: { name: data.contact.name, address: data.contact.email },
    subject: `New website inquiry — ${label}`,
    text: buildContactText(data),
    html: buildContactHtml(data),
    headers: { 'X-Project-Request-Id': data.submissionId },
  }

  return deliver(config, mail, STUDIO_EMAIL)
}

export async function sendCustomerConfirmation(data) {
  const config = readConfig()
  if (!config.configured) throw new EmailConfigError(config.reason)

  const mail = {
    from: config.sender,
    to: data.contact.email,
    replyTo: STUDIO_EMAIL,
    subject:
      data.source === 'contact'
        ? 'We received your message — BRIX Studio'
        : 'We received your project request — BRIX Studio',
    text: buildConfirmationText(data),
    html: buildConfirmationHtml(data),
    headers: { 'X-Project-Request-Id': data.submissionId },
  }

  return deliver(config, mail, data.contact.email)
}
