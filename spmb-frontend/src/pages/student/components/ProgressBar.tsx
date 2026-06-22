import type { StepInfo } from '../../../types'

interface ProgressBarProps {
  steps: StepInfo[]
  currentStep: number
}

export default function ProgressBar({ steps, currentStep }: ProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between mb-8 relative">
        {steps.map((step, index) => {
          const isActive = step.nomor === currentStep
          const isCompleted = step.selesai
          const isFuture = !isCompleted && !isActive
          const isLast = index === steps.length - 1

          return (
            <div key={step.nomor} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="flex flex-col items-center relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 
                    ${isCompleted ? 'bg-brand-green text-white shadow-sm' : ''}
                    ${isActive ? 'bg-brand-green-dark text-white ring-4 ring-brand-green-light shadow-sm' : ''}
                    ${isFuture ? 'bg-slate-200 text-slate-400' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.nomor}
                </div>
                <span
                  className={`absolute top-12 whitespace-nowrap text-[10px] font-medium text-center hidden sm:block
                    ${isActive ? 'text-brand-green-dark' : ''}
                    ${isCompleted ? 'text-brand-green' : ''}
                    ${isFuture ? 'text-slate-400' : ''}
                  `}
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-brand-green' : 'bg-slate-200'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
