import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ProgressBar from './ProgressBar'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import type { StepInfo } from '../../../types'

interface StepLayoutProps {
  title: string
  subtitle: string
  steps: StepInfo[]
  currentStep: number
  children: ReactNode
  onPrevious?: () => void
  onNext?: () => void
  isFirst?: boolean
  isLast?: boolean
  loading?: boolean
}

export default function StepLayout({
  title,
  subtitle,
  steps,
  currentStep,
  children,
  onPrevious,
  onNext,
  isFirst = false,
  isLast = false,
  loading = false,
}: StepLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">Form Pendaftaran</h2>
        <p className="text-sm text-slate-500">Lengkapi data pendaftaran Anda</p>
      </div>

      <Card className="p-4 sm:p-6">
        <ProgressBar steps={steps} currentStep={currentStep} />
      </Card>

      <Card className="p-4 sm:p-6">
        <div className="mb-5 sm:mb-6">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>

        {children}
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Button
          onClick={onPrevious}
          variant="secondary"
          disabled={isFirst || loading}
          fullWidth
          className="sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Sebelumnya
        </Button>

        {onNext && (
          <Button onClick={onNext} loading={loading} fullWidth className="sm:w-auto">
            {isLast ? 'Selesai' : 'Selanjutnya'}
            {!isLast && <ArrowRight className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </div>
  )
}
