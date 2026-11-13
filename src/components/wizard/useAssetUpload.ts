import { useCallback, useMemo, useState } from 'react'
import { useProject } from '../../context/ProjectContext'
import type { Attachment, AttachmentKind } from '../../types'
import {
  deleteDraftUpload,
  getUploadDraftId,
  uploadDraftFile,
  uploadErrorMessage,
  uploadLimits,
  validateDraftFile,
} from '../../lib/uploads'

const sessionPreviews = new Map<string, string>()

export function getAttachmentPreview(id: string): string | undefined {
  return sessionPreviews.get(id)
}

export function useAssetUpload() {
  const { draft, addAttachments, updateAttachment, removeAttachment } = useProject()
  const draftId = useMemo(() => getUploadDraftId(), [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFiles = useCallback(
    async (incoming: FileList | File[], kind: AttachmentKind) => {
      const files = Array.from(incoming)
      if (!files.length) return
      setError(null)

      const remaining = uploadLimits.maxFiles - draft.details.attachments.length
      if (remaining <= 0) {
        setError(`You can attach up to ${uploadLimits.maxFiles} files. Remove one to add another.`)
        return
      }

      const accepted: File[] = []
      const rejected: string[] = []
      for (const file of files.slice(0, remaining)) {
        const problem = validateDraftFile(file, kind)
        if (problem) rejected.push(`${file.name} — ${problem}`)
        else accepted.push(file)
      }
      if (files.length > remaining) {
        rejected.push(`Only ${remaining} more file${remaining === 1 ? '' : 's'} can be added.`)
      }
      if (rejected.length) setError(rejected.join(' '))
      if (!accepted.length) return

      const placeholders: Attachment[] = accepted.map((file) => {
        const id = crypto.randomUUID()
        sessionPreviews.set(id, URL.createObjectURL(file))
        return {
          id,
          kind,
          name: file.name,
          size: file.size,
          mime: file.type,
          status: 'uploading',
        }
      })
      addAttachments(placeholders)
      setUploading(true)

      await Promise.all(
        accepted.map(async (file, index) => {
          const placeholder = placeholders[index]
          try {
            const stored = await uploadDraftFile(draftId, file, kind)
            updateAttachment(placeholder.id, {
              remoteId: stored.id,
              name: stored.name,
              mime: stored.mime,
              size: stored.size,
              status: 'uploaded',
              error: undefined,
            })
          } catch (uploadError) {
            updateAttachment(placeholder.id, {
              status: 'error',
              error: uploadErrorMessage(uploadError),
            })
          }
        }),
      )
      setUploading(false)
    },
    [addAttachments, draftId, draft.details.attachments.length, updateAttachment],
  )

  const removeFile = useCallback(
    (id: string) => {
      const file = draft.details.attachments.find((entry) => entry.id === id)
      removeAttachment(id)
      const preview = sessionPreviews.get(id)
      if (preview) {
        URL.revokeObjectURL(preview)
        sessionPreviews.delete(id)
      }
      if (file?.remoteId) {
        void deleteDraftUpload(draftId, file.remoteId).catch(() => {})
      }
    },
    [draft.details.attachments, draftId, removeAttachment],
  )

  return { uploading, error, uploadFiles, removeFile, draftId }
}
