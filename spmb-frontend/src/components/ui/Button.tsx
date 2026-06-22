import type { ReactNode } from 'react'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  disabled?: boolean
  loading?: boolean
  className?: string
  fullWidth?: boolean
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const base = 'px-6 py-2.5 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm'
  const variants: Record<string, string> = {
    primary: 'bg-brand-green hover:bg-brand-green-dark text-white shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none',
    secondary: 'bg-brand-green-light text-brand-green-dark hover:bg-brand-green hover:text-white shadow-sm hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-md disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none',
    ghost: 'text-brand-green-dark hover:text-brand-green hover:bg-brand-green-light disabled:text-gray-300 disabled:hover:bg-transparent',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
