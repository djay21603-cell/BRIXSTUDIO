import { cleanupExpired, openDatabase, resolveDataDir } from './db.js'
import { errorHandler } from './errors.js'
import { createFoundationRouter } from './router.js'
import { cleanupInquiryUploads } from '../inquiries.js'

export function initFoundation(app, { dataDir = resolveDataDir() } = {}) {
  const db = openDatabase(dataDir)
  app.use('/api/v1', createFoundationRouter({ db, dataDir }))
  app.use('/api/v1', errorHandler)

  const auditRetentionDays = positiveInt(process.env.AUDIT_RETENTION_DAYS, 180)
  const inquiryUploadDays = positiveInt(process.env.INQUIRY_UPLOAD_RETENTION_DAYS, 14)
  const runCleanup = async () => {
    try {
      const result = cleanupExpired(db, { auditRetentionDays })
      const abandonedUploads = await cleanupInquiryUploads(db, dataDir, { maxAgeDays: inquiryUploadDays })
      if (result.sessions || result.limits || result.auditEvents || abandonedUploads) {
        console.log(
          `[foundation] cleanup: ${result.sessions} sessions, ${result.limits} rate windows, ${result.auditEvents} audit events, ${abandonedUploads} abandoned attachments`,
        )
      }
    } catch (error) {
      console.error(`[foundation] cleanup failed: ${error?.message || error}`)
    }
  }
  void runCleanup()
  const timer = setInterval(runCleanup, 60 * 60 * 1000)
  timer.unref()

  return {
    db,
    dataDir,
    close() {
      clearInterval(timer)
      try {
        db.close()
      } catch {
        /* already closed */
      }
    },
  }
}

function positiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}
