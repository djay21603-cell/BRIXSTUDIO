import { audit, openDatabase } from '../foundation/db.js'
import { normalizeEmail } from '../foundation/auth.js'

const ROLES = ['user', 'client', 'admin']
const [emailArg, roleArg] = process.argv.slice(2)

if (!emailArg || !ROLES.includes(roleArg)) {
  console.error('Usage: npm run db:set-role -- <email> <user|client|admin>')
  process.exit(1)
}

const db = openDatabase()
const email = normalizeEmail(emailArg)
const user = db.prepare('SELECT id, email, role FROM users WHERE email = ? COLLATE NOCASE').get(email)

if (!user) {
  console.error(`No account found for ${email}.`)
  db.close()
  process.exit(1)
}

db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(roleArg, new Date().toISOString(), user.id)
audit(db, { action: 'admin.role_set', targetType: 'user', targetId: user.id, meta: { from: user.role, to: roleArg } })
console.log(`${user.email}: ${user.role} -> ${roleArg}`)
db.close()
