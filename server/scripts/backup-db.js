import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { openDatabase, resolveDataDir } from '../foundation/db.js'

const dataDir = resolveDataDir()
const backupDir = path.resolve(process.cwd(), 'var/backups')
mkdirSync(backupDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const target = path.join(backupDir, `brix-${stamp}.sqlite`)

const db = openDatabase(dataDir)
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`)
db.close()

console.log(`Database snapshot written to ${target}`)
