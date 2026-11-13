import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'client', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  terms_accepted_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'project' CHECK (kind IN ('personal', 'project', 'studio')),
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON workspace_members(user_id);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_workspace ON uploads(workspace_id);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'brief' CHECK (kind IN ('brief', 'contact')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  business_name TEXT,
  category TEXT,
  template TEXT,
  message TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'quotation_sent', 'approved', 'completed')),
  studio_email_status TEXT NOT NULL DEFAULT 'pending' CHECK (studio_email_status IN ('pending', 'sent', 'failed', 'not_configured')),
  customer_email_status TEXT NOT NULL DEFAULT 'pending' CHECK (customer_email_status IN ('pending', 'sent', 'failed', 'not_configured')),
  studio_message_id TEXT,
  customer_message_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

CREATE TABLE IF NOT EXISTS inquiry_uploads (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  inquiry_id TEXT REFERENCES inquiries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'reference' CHECK (kind IN ('logo', 'reference')),
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_inquiry_uploads_draft ON inquiry_uploads(draft_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_uploads_inquiry ON inquiry_uploads(inquiry_id);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_expires ON rate_limits(expires_at);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta TEXT,
  ip TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
`

export function resolveDataDir() {
  const configured = process.env.DATA_DIR?.trim()
  return path.resolve(process.cwd(), configured || 'var/data')
}

export function openDatabase(dataDir = resolveDataDir()) {
  mkdirSync(dataDir, { recursive: true })
  mkdirSync(path.join(dataDir, 'uploads'), { recursive: true })
  mkdirSync(path.join(dataDir, 'inquiry-uploads'), { recursive: true })
  mkdirSync(path.join(dataDir, 'tmp'), { recursive: true })

  const db = new DatabaseSync(path.join(dataDir, 'brix.sqlite'))
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA synchronous = NORMAL')
  db.exec('PRAGMA foreign_keys = ON')
  db.exec('PRAGMA busy_timeout = 5000')
  db.exec(SCHEMA)
  return db
}

export function nowIso() {
  return new Date().toISOString()
}

export function audit(db, { actorId = null, action, targetType = null, targetId = null, meta = null, ip = null }) {
  try {
    db.prepare(
      `INSERT INTO audit_events (actor_id, action, target_type, target_id, meta, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(actorId, action, targetType, targetId, meta ? JSON.stringify(meta) : null, ip, nowIso())
  } catch (error) {
    console.error(`[audit] could not record ${action}: ${error?.message || error}`)
  }
}

export function cleanupExpired(db, { auditRetentionDays = 180 } = {}) {
  const now = nowIso()
  const sessions = db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now)
  const limits = db.prepare('DELETE FROM rate_limits WHERE expires_at <= ?').run(Date.now())
  const cutoff = new Date(Date.now() - auditRetentionDays * 24 * 60 * 60 * 1000).toISOString()
  const events = db.prepare('DELETE FROM audit_events WHERE created_at <= ?').run(cutoff)
  return {
    sessions: Number(sessions.changes),
    limits: Number(limits.changes),
    auditEvents: Number(events.changes),
  }
}
