import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Download, FileText, Image as ImageIcon, LoaderCircle, ShieldCheck, Trash2, UploadCloud } from 'lucide-react'
import { Badge } from '../../components/ui/FormField'
import { usePageTitle } from '../../hooks/usePageTitle'
import {
  ApiError,
  api,
  downloadFile,
  formatBytes,
  formatDate,
  type UploadItem,
  type UploadUsage,
} from '../../lib/api'

export function FilesPage() {
  usePageTitle('Files — BRIX Studio')
  const [items, setItems] = useState<UploadItem[]>([])
  const [usage, setUsage] = useState<UploadUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      const result = await api.get<{ ok: true; items: UploadItem[]; usage: UploadUsage }>('/api/v1/uploads')
      setItems(result.items)
      setUsage(result.usage)
      setError(null)
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'Files could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const upload = async (file: File) => {
    setError(null)
    if (usage && file.size > usage.maxFileBytes) {
      setError(`"${file.name}" is larger than the ${formatBytes(usage.maxFileBytes)} per-file limit.`)
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const result = await api.upload<{ ok: true; upload: UploadItem; usage: UploadUsage }>('/api/v1/uploads', form)
      setItems((current) => [result.upload, ...current])
      setUsage(result.usage)
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'The upload did not complete.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) void upload(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void upload(file)
  }

  const download = async (item: UploadItem) => {
    setError(null)
    try {
      await downloadFile(`/api/v1/uploads/${item.id}/content`, item.name)
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'The file could not be downloaded.')
    }
  }

  const remove = async (item: UploadItem) => {
    setError(null)
    try {
      const result = await api.del<{ ok: true; usage: UploadUsage }>(`/api/v1/uploads/${item.id}`)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      setUsage(result.usage)
      setPendingDelete(null)
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : 'The file could not be deleted.')
    }
  }

  const usedPercent = usage && usage.quotaBytes > 0 ? Math.min(100, (usage.bytes / usage.quotaBytes) * 100) : 0

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-clay">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            Secure storage
          </p>
          <h1 className="display mt-4 text-[clamp(2.4rem,4vw,3.4rem)] text-ink">Files &amp; assets.</h1>
          <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-ink/50">
            Upload brand imagery and PDFs. Files are validated by content, stored privately and only
            visible to your account.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/35">Storage used</p>
          <p className="mt-1 text-[15px] font-semibold text-ink">
            {formatBytes(usage?.bytes ?? 0)}
            <span className="text-[11px] font-normal text-ink/35"> / {formatBytes(usage?.quotaBytes ?? 0)}</span>
          </p>
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-ink/10">
            <span className="gradient-brand block h-full rounded-full" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-ink/30">
            {usage?.count ?? 0} of {usage?.maxFiles ?? 0} files
          </p>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[12.5px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border border-dashed p-8 text-center transition-colors ${
          dragging ? 'border-cyan/60 bg-cyan/5' : 'border-ink/20 bg-ink/[0.02]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".png,.jpg,.jpeg,.gif,.webp,.pdf"
          onChange={onPick}
          disabled={uploading}
        />
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-clay/30 bg-clay/15 text-ink">
          {uploading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
        </span>
        <p className="mt-4 text-[13px] font-semibold text-ink">
          {uploading ? 'Validating and storing…' : 'Drop a file here or choose one'}
        </p>
        <p className="mt-1 text-[11px] text-ink/35">
          PNG, JPEG, GIF, WebP or PDF · up to {formatBytes(usage?.maxFileBytes ?? 0)} each
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-4 inline-flex h-9 items-center rounded-full border border-ink/20 px-4 text-[11.5px] font-semibold text-ink/70 transition-colors hover:border-clay/60 hover:text-ink disabled:opacity-40"
        >
          Choose file
        </button>
      </div>

      <section>
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
          <h2 className="text-[14px] font-semibold text-ink">Your files</h2>
          <Badge tone="neutral">{items.length} stored</Badge>
        </div>

        {loading ? (
          <p className="py-10 text-center text-[12px] text-ink/35">Loading files…</p>
        ) : items.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-[13px] text-ink/45">No files yet. Your first upload will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink/8">
            {items.map((item) => {
              const isImage = item.mime.startsWith('image/')
              const Icon = isImage ? ImageIcon : FileText
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-ink/10 bg-ink/[0.03] text-ink/55">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[10.5px] text-ink/35">
                      {formatBytes(item.size)} · {formatDate(item.createdAt)} · {isImage ? 'Image' : 'PDF'}
                    </p>
                  </div>
                  {pendingDelete === item.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-danger">Delete this file?</span>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        className="rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-[10.5px] font-semibold text-danger"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="rounded-full border border-ink/15 px-3 py-1.5 text-[10.5px] font-semibold text-ink/50"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => download(item)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 text-ink/50 transition-colors hover:border-cyan/40 hover:text-ink"
                        aria-label={`Download ${item.name}`}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(item.id)}
                        className="grid h-8 w-8 place-items-center rounded-full border border-ink/12 text-ink/45 transition-colors hover:border-danger/40 hover:text-danger"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="flex items-start gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-[11px] leading-relaxed text-ink/40">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan" />
        Uploads are checked against real file signatures, not just extensions. Deleting your account
        removes every stored file. Render&apos;s free disk is ephemeral — configure a persistent disk or
        object storage before production use.
      </p>
    </div>
  )
}
