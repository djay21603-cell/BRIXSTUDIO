import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, Sparkles } from 'lucide-react'
import { useProject } from '../context/ProjectContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { openGmailCompose } from '../lib/gmail'
import {
  buildProjectRequest,
  newSubmissionId,
  requestSignature,
  submitProjectRequest,
  type ConfirmationState,
} from '../lib/submit'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { WizardProgress } from '../components/wizard/WizardProgress'
import { LivePreview } from '../components/wizard/LivePreview'
import {
  StepBranding,
  StepBusiness,
  StepCommunication,
  StepDesign,
  StepDetails,
  StepFeatures,
  StepMotion,
  StepPages,
  StepReview,
} from '../components/wizard/WizardSteps'
import { cx } from '../lib/cx'

const nextLabels: Record<number, string> = {
  1: 'Choose a design',
  2: 'Choose pages',
  3: 'Set colours',
  4: 'Choose features',
  5: 'Set communication',
  6: 'Choose motion',
  7: 'Add details',
  8: 'Review brief',
}

function emailIsValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

type SendState =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent'; at: string; signature: string; confirmation: ConfirmationState }
  | { status: 'error'; code: string; message: string; signature: string }

export function WizardPage() {
  usePageTitle('Project builder — BRIX Studio')
  const { draft, saveState } = useProject()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [showDetailErrors, setShowDetailErrors] = useState(false)
  const [emailOpened, setEmailOpened] = useState(false)
  const [sendState, setSendState] = useState<SendState>({ status: 'idle' })
  const [previewOpen, setPreviewOpen] = useState(false)
  const submissionIdRef = useRef<string | null>(null)
  const submittedSignatureRef = useRef<string | null>(null)

  const rawStep = Number(params.get('step') ?? '1')
  const step = Number.isFinite(rawStep) ? Math.min(9, Math.max(1, Math.trunc(rawStep))) : 1

  const canVisit = (target: number) => {
    if (target >= 2 && !draft.categoryId) return false
    if (target >= 3 && !draft.templateId) return false
    return true
  }

  const goToStep = (target: number) => {
    if (!canVisit(target)) return
    setParams({ step: String(target) })
    setShowDetailErrors(false)
    setPreviewOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }

  useEffect(() => {
    if (!Number.isFinite(rawStep) || rawStep < 1 || rawStep > 9) {
      setParams({ step: '1' }, { replace: true })
      return
    }
    if (step >= 2 && !draft.categoryId) {
      setParams({ step: '1' }, { replace: true })
      return
    }
    if (step >= 3 && !draft.templateId) {
      setParams({ step: '2' }, { replace: true })
    }
  }, [rawStep, step, draft.categoryId, draft.templateId, setParams])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [step])

  const detailsValid = Boolean(draft.details.contactName.trim() && emailIsValid(draft.details.email))
  const uploadsPending = draft.details.attachments.some((file) => file.status === 'uploading')

  const completed = useMemo(() => {
    const set = new Set<number>()
    if (draft.categoryId) set.add(1)
    if (draft.templateId) set.add(2)
    if (draft.pages.length) set.add(3)
    if (draft.brand.businessName.trim()) set.add(4)
    if (draft.features.length) set.add(5)
    if (draft.channels.length) set.add(6)
    set.add(7)
    if (detailsValid) set.add(8)
    return set
  }, [draft, detailsValid])

  const canProceed =
    step === 8 ? detailsValid : step < 9 ? canVisit(step + 1) : false

  const helper = (() => {
    if (step === 1 && !draft.categoryId) return 'Select a business type to continue.'
    if (step === 2 && !draft.templateId) return 'Select a design direction to continue.'
    if (step === 8 && !detailsValid) return 'Add your name and a valid email to continue.'
    return null
  })()

  const next = () => {
    if (!canProceed) {
      if (step === 8) setShowDetailErrors(true)
      return
    }
    goToStep(step + 1)
    setEmailOpened(false)
  }

  const signature = useMemo(
    () => requestSignature(buildProjectRequest(draft, '', '')),
    [draft],
  )
  const isSent = sendState.status === 'sent' && sendState.signature === signature
  const effectiveSendStatus =
    (sendState.status === 'sent' && !isSent) ||
    (sendState.status === 'error' && sendState.signature !== signature)
      ? 'idle'
      : sendState.status

  const openEmail = () => {
    if (!detailsValid) {
      goToStep(8)
      setShowDetailErrors(true)
      return
    }
    openGmailCompose(draft)
    setEmailOpened(true)
  }

  const sendRequest = async () => {
    if (!detailsValid) {
      goToStep(8)
      setShowDetailErrors(true)
      return
    }
    if (sendState.status === 'sending' || isSent) return

    if (!submissionIdRef.current || submittedSignatureRef.current !== signature) {
      submissionIdRef.current = newSubmissionId()
      submittedSignatureRef.current = signature
    }

    setSendState({ status: 'sending' })
    setEmailOpened(false)

    const submittedAt = new Date().toISOString()
    const payload = buildProjectRequest(draft, submissionIdRef.current, submittedAt)
    const result = await submitProjectRequest(payload)

    if (result.ok) {
      setSendState({ status: 'sent', at: submittedAt, signature, confirmation: result.confirmation })
    } else {
      setSendState({ status: 'error', code: result.code, message: result.message, signature })
    }
  }

  return (
    <div className="page-canvas flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-bone/85 backdrop-blur-xl">
        <div className="shell-wide flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden items-center gap-2 text-[9.5px] font-bold uppercase tracking-[0.2em] text-ink/35 sm:flex">
              <span className="h-4 w-px bg-ink/15" aria-hidden="true" />
              Project builder
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-1.5 text-[10.5px] font-medium text-ink/35 sm:inline-flex"
              role="status"
            >
              {saveState === 'saved' ? (
                <>
                  <Check className="h-3 w-3 text-moss" />
                  Saved on this device
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-clay" />
                  Saving…
                </>
              )}
            </span>
            <Link
              to="/"
              className="rounded-full border border-ink/15 px-3.5 py-2 text-[11px] font-semibold text-ink/60 transition-colors hover:border-ink/35 hover:text-ink"
            >
              Save &amp; exit
            </Link>
          </div>
        </div>
      </header>

      <WizardProgress current={step} completed={completed} canVisit={canVisit} onSelect={goToStep} />

      <div className="shell-wide flex-1 py-8 lg:py-10">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(400px,0.8fr)] xl:gap-12">
          <div className="min-w-0">
            <div key={step} className="step-enter">
              {step === 1 ? <StepBusiness /> : null}
              {step === 2 ? <StepDesign /> : null}
              {step === 3 ? <StepPages /> : null}
              {step === 4 ? <StepBranding /> : null}
              {step === 5 ? <StepFeatures /> : null}
              {step === 6 ? <StepCommunication /> : null}
              {step === 7 ? <StepMotion /> : null}
              {step === 8 ? <StepDetails showErrors={showDetailErrors} /> : null}
              {step === 9 ? (
                <StepReview
                  goToStep={goToStep}
                  canSend={detailsValid && !uploadsPending}
                  uploadsPending={uploadsPending}
                  sendStatus={effectiveSendStatus}
                  sendError={
                    sendState.status === 'error' && effectiveSendStatus === 'error'
                      ? { code: sendState.code, message: sendState.message }
                      : null
                  }
                  sentAt={isSent && sendState.status === 'sent' ? sendState.at : null}
                  isSent={isSent}
                  confirmation={isSent && sendState.status === 'sent' ? sendState.confirmation : null}
                  onSend={sendRequest}
                  emailOpened={emailOpened}
                  onEmail={openEmail}
                />
              ) : null}
            </div>

            <div className="mt-10 flex flex-col gap-4 border-t border-ink/12 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => goToStep(step - 1)}
                  disabled={step === 1}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 px-4 text-[12px] font-semibold text-ink/60 transition-colors hover:border-ink/35 hover:text-ink xl:hidden"
                >
                  <Eye className="h-4 w-4" />
                  Preview site
                </button>
              </div>

              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {step < 9 ? (
                  <Button size="md" onClick={next} disabled={!canProceed}>
                    {nextLabels[step]}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-[11px] text-ink/40">Review your brief above.</span>
                )}
                {helper ? (
                  <p className={cx('text-[10.5px]', step === 8 && showDetailErrors ? 'text-danger' : 'text-ink/35')}>
                    {helper}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-[142px]">
              <LivePreview onChooseDesign={() => goToStep(2)} />
              <div className="mt-4 rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-[10.5px] leading-relaxed text-ink/40">
                <p className="font-semibold text-ink/60">Preview notes</p>
                <ul className="mt-2 space-y-1 pl-4">
                  <li className="list-disc">Sample copy stands in until your content is supplied.</li>
                  <li className="list-disc">Device switching and the contact widget are interactive.</li>
                  <li className="list-disc">Your selections update the preview immediately.</li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="border-t border-ink/10 bg-bone/60">
        <div className="shell-wide flex flex-wrap items-center justify-between gap-3 py-5 text-[10.5px] text-ink/35">
          <p>Your answers stay in this browser. Nothing is sent until you submit the request.</p>
          <button
            type="button"
            onClick={() => navigate('/designs')}
            className="font-semibold text-ink/45 underline underline-offset-4 transition-colors hover:text-ink"
          >
            Browse full design gallery
          </button>
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Live preview"
        description="Reflects your current selections. Switch between desktop, tablet and mobile."
        size="default"
      >
        <div className="bg-cream/55 p-3 sm:p-5">
          <LivePreview className="shadow-none" onChooseDesign={() => goToStep(2)} />
        </div>
      </Modal>
    </div>
  )
}
