import type { StepInfo } from '../../../types'

interface ProgressBarProps {
  steps: StepInfo[]
  currentStep: number
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-1 sm:px-4">
      <ol className="relative flex items-start justify-between">
        {steps.map((step, index) => {
          const isActive = step.nomor === currentStep
          const isCompleted = step.selesai
          const isFuture = !isCompleted && !isActive
          const isLast = index === steps.length - 1

          return (
            <li key={step.nomor} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
              <div className="flex w-12 flex-col items-center sm:w-24">
                <span
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 sm:h-10 sm:w-10 sm:text-sm
                    ${isCompleted ? 'bg-brand-green text-white shadow-sm' : ''}
                    ${isActive ? 'bg-brand-green-dark text-white ring-2 ring-brand-green-light shadow-sm sm:ring-4' : ''}
                    ${isFuture ? 'bg-slate-200 text-slate-400' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.nomor}
                </span>
                <span
                  className={`mt-1.5 w-full break-words text-center text-[10px] font-medium leading-tight sm:text-[11px]
                    ${isActive ? 'text-brand-green-dark' : ''}
                    ${isCompleted ? 'text-brand-green' : ''}
                    ${isFuture ? 'text-slate-400' : ''}
                  `}
                >
                  <span className="sm:hidden">{step.shortLabel ?? step.label}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </div>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`mt-4 h-0.5 flex-1 sm:mx-2 ${isCompleted ? 'bg-brand-green' : 'bg-slate-200'}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
