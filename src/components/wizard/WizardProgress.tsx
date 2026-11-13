import { Check } from 'lucide-react'
import { wizardSteps } from '../../data/options'
import { cx } from '../../lib/cx'

interface WizardProgressProps {
  current: number
  completed: Set<number>
  canVisit: (step: number) => boolean
  onSelect: (step: number) => void
}

export function WizardProgress({ current, completed, canVisit, onSelect }: WizardProgressProps) {
  return (
    <div className="border-b border-ink/10 bg-bone/85 backdrop-blur">
      <div className="shell-wide">
        <div className="hidden py-3 lg:block">
          <ol className="flex items-center justify-between gap-1">
            {wizardSteps.map((step, index) => {
              const active = current === step.id
              const done = completed.has(step.id) && !active
              const enabled = canVisit(step.id)
              return (
                <li key={step.id} className="flex min-w-0 flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => enabled && onSelect(step.id)}
                    disabled={!enabled}
                    aria-current={active ? 'step' : undefined}
                    className={cx(
                      'group flex min-w-0 items-center gap-2.5 rounded-full px-1 py-1 text-left transition-colors',
                      enabled ? 'cursor-pointer' : 'cursor-not-allowed',
                    )}
                  >
                    <span
                      className={cx(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold transition-all duration-300',
                        active
                          ? 'border-clay bg-clay text-white'
                          : done
                            ? 'border-ink/20 bg-ink/10 text-ink'
                            : enabled
                              ? 'border-ink/20 text-ink/45 group-hover:border-ink/45 group-hover:text-ink'
                              : 'border-ink/10 text-ink/20',
                      )}
                    >
                      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : step.id}
                    </span>
                    <span
                      className={cx(
                        'truncate text-[11px] font-semibold transition-colors',
                        active ? 'text-ink' : done ? 'text-ink/60' : enabled ? 'text-ink/40' : 'text-ink/20',
                      )}
                    >
                      {step.shortLabel}
                    </span>
                  </button>
                  {index < wizardSteps.length - 1 ? (
                    <span className="mx-1 h-px flex-1 bg-ink/10" aria-hidden="true" />
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>

        <div className="py-3.5 lg:hidden">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em]">
            <span className="text-clay">Step {current} of 9</span>
            <span className="text-ink/45">{wizardSteps[current - 1]?.label}</span>
          </div>
          <div className="mt-2.5 flex gap-1" aria-hidden="true">
            {wizardSteps.map((step) => (
              <span
                key={step.id}
                className={cx(
                  'h-1 flex-1 rounded-full transition-colors duration-300',
                  step.id === current ? 'bg-clay' : step.id < current ? 'bg-ink/45' : 'bg-ink/10',
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
