import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  type: ToastType
  message: string
  onClose?: () => void
}

const toastStyles: Record<ToastType, { icon: typeof CheckCircle2; wrap: string; iconWrap: string }> = {
  success: {
    icon: CheckCircle2,
    wrap: 'bg-brand-green text-white',
    iconWrap: 'text-white',
  },
  error: {
    icon: XCircle,
    wrap: 'bg-red-600 text-white',
    iconWrap: 'text-white',
  },
  info: {
    icon: Info,
    wrap: 'bg-slate-800 text-white',
    iconWrap: 'text-white',
  },
}

export default function Toast({ type, message, onClose }: ToastProps) {
  const { icon: Icon, wrap } = toastStyles[type]

  return (
    <div className="fixed top-20 sm:top-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] sm:w-auto sm:max-w-md pointer-events-none">
      <div
        role="status"
        className={`flex items-center gap-2.5 pl-4 pr-2 py-2.5 rounded-xl shadow-lg backdrop-blur-md animate-toast-in pointer-events-auto ${wrap}`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium leading-snug">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="ml-1 p-1.5 rounded-lg hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
