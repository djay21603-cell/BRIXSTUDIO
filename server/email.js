import nodemailer from 'nodemailer'

/** The destination is fixed server-side so the browser can never redirect project requests. */
export const STUDIO_EMAIL = 'mendozafabillar@gmail.com'

export class EmailConfigError extends Error {}

let cachedTransport = null

function readConfig() {
  const user = (process.env.GMAIL_USER || '').trim()
  const appPassword = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
  const clientId = (process.env.GMAIL_CLIENT_ID || '').trim()
  const clientSecret = (process.env.GMAIL_CLIENT_SECRET || '').trim()
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim()

  if (!user) return { configured: false, reason: 'GMAIL_USER is not set.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
    return { configured: false, reason: 'GMAIL_USER is not a valid email address.' }
  }

  if (appPassword) {
    return { configured: true, user, mode: 'smtp', auth: { user, pass: appPassword } }
  }

  if (clientId && clientSecret && refreshToken) {
    return {
      configured: true,
      user,
      mode: 'gmail_api',
      clientId,
      clientSecret,
      refreshToken,
    }
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
  }
}

/* ---- Gmail API (OAuth 2.0 refresh token) ---- */

let tokenCache = null

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
  if (cachedTransport && cachedTransport.user === config.user) return cachedTransport.transport
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: config.auth,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  })
  cachedTransport = { user: config.user, transport }
  return transport
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

function buildHtml(data) {
  const assetRows = []
  if (data.assetLinks) assetRows.push(row('Links', data.assetLinks))
  if (data.assets.length) {
    assetRows.push(
      row(
        'Attached in builder',
        data.assets.map((asset) => `${asset.name} (${formatBytes(asset.size)})`).join('\n'),
      ),
    )
  }
  if (!assetRows.length) assetRows.push(row('Assets', 'None referenced'))

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
                      <span style="display:inline-block;padding:8px 10px;border-radius:10px;background:#386bff;font:700 12px/1 Arial,sans-serif;letter-spacing:0.04em;color:#ffffff;">CS</span>
                      <span style="font:700 13px/1 Arial,sans-serif;letter-spacing:0.22em;color:#f4f7ff;margin-left:12px;">STUDIO</span>
                      <p style="margin:14px 0 0;font:400 12px/1.6 Arial,sans-serif;color:#a3aec2;">New project request from the website builder</p>
                    </td>
                    <td align="right" style="font:400 11px/1.6 Arial,sans-serif;color:#a3aec2;">
                      ${escapeHtml(readableTime(data.submittedAt))}
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
                      <h1 style="margin:0;font:600 24px/1.3 Georgia,serif;color:#f4f7ff;">${escapeHtml(data.business.name)}</h1>
                      <p style="margin:6px 0 0;font:400 13px/1.6 Arial,sans-serif;color:#a3aec2;">${escapeHtml(data.business.tagline || 'Website project request')}</p>
                    </td>
                  </tr>
                  ${section('Contact', [
                    row('Full name', data.contact.name),
                    row('Email', data.contact.email),
                    row('Phone', data.contact.phone || 'Not provided'),
                    row('Location', data.contact.location || 'Not provided'),
                  ].join(''))}
                  ${section('Business', [
                    row('Business type', data.business.category),
                    row('Existing website', data.business.existingUrl || 'None'),
                  ].join(''))}
                  ${section('Design & scope', [
                    row('Template', data.design.template),
                    row('Style', data.design.style || 'Not specified'),
                    row('Pages', joinOr(data.pages, 'None selected')),
                    row('Features', joinOr(data.features, 'None selected')),
                    row('Communication', joinOr(data.channels, 'None selected')),
                    row('Animation', data.motion),
                  ].join(''))}
                  ${section('Brand', [
                    swatchRow(data.brand),
                    row('Typography', data.brand.typography),
                  ].join(''))}
                  ${section('About the business', [
                    row('Description', data.business.description || 'Not provided'),
                  ].join(''))}
                  ${section('Assets', assetRows.join(''))}
                  ${section('Submission', [row('Reference', data.submissionId, true)].join(''))}
                </table>
                <p style="margin:26px 0 0;padding-top:18px;border-top:1px solid #24314d;font:400 11px/1.7 Arial,sans-serif;color:#a3aec2;">
                  Sent by the BRIX Studio project builder. Reply to this email to reach ${escapeHtml(data.contact.name)} directly.
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

function buildText(data) {
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
    data.assets.length
      ? data.assets.map((asset) => `Selected in builder: ${asset.name} (${formatBytes(asset.size)}, not uploaded)`).join('\n')
      : 'Selected in builder: none',
    '',
    `Reference: ${data.submissionId}`,
    '',
    `Reply to this email to reach ${data.contact.name}.`,
  ].join('\n')
}

export async function sendProjectRequest(data) {
  const config = readConfig()
  if (!config.configured) throw new EmailConfigError(config.reason)

  const business = data.business.name === 'Not provided' ? 'New website project' : data.business.name
  const mail = {
    from: `"BRIX Studio" <${config.user}>`,
    to: STUDIO_EMAIL,
    replyTo: { name: data.contact.name, address: data.contact.email },
    subject: `New project request — ${business} (${data.business.category})`,
    text: buildText(data),
    html: buildHtml(data),
    headers: {
      'X-Project-Request-Id': data.submissionId,
    },
  }

  if (config.mode === 'gmail_api') {
    const info = await sendViaGmailApi(config, mail)
    return { messageId: info.messageId, transport: 'gmail_api' }
  }

  const transport = transportFor(config)
  const info = await transport.sendMail(mail)

  const accepted = Array.isArray(info.accepted) ? info.accepted : []
  const delivered = accepted.some(
    (address) => String(address).toLowerCase() === STUDIO_EMAIL.toLowerCase(),
  )
  if (!delivered) {
    throw new Error(`SMTP server did not accept the studio recipient (accepted: ${accepted.join(', ') || 'none'})`)
  }

  return { messageId: info.messageId, transport: 'smtp' }
}
