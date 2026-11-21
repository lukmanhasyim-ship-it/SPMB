import type { ChangeEvent } from 'react'

type InputMode = 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'

interface InputFieldProps {
  label: string
  name: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string
  helperText?: string
  options?: { value: string; label: string }[]
  textarea?: boolean
  maxLength?: number
  min?: number
  max?: number
  /** Numeric/tel keyboard untuk field nomor di mobile. */
  inputMode?: InputMode
  /** Petunjuk autofill browser (nama, tel, email, dll). */
  autoComplete?: string
}

export default function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  error,
  helperText,
  options,
  textarea = false,
  maxLength,
  min,
  max,
  inputMode,
  autoComplete,
}: InputFieldProps) {
  // iOS Safari otomatis zoom bila font-size input < 16px. text-base di mobile
  // mencegah zoom tersebut; sm:text-sm mengembalikan kepadatan di desktop.
  const inputClass = `w-full min-h-touch px-4 py-2.5 rounded-xl border ${error ? 'border-red-400' : 'border-slate-200'} bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all duration-200 text-base sm:text-sm ${disabled ? 'bg-slate-50 cursor-not-allowed' : ''}`

  const describedBy = [helperText ? `${name}-helper` : '', error ? `${name}-error` : '']
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-slate-700">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass + ' resize-none'}
        />
      ) : options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        >
          <option value="">-- Pilih --</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          min={min}
          max={max}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
      )}

      {helperText && <p id={`${name}-helper`} className="text-xs text-slate-500 mt-0.5">{helperText}</p>}
      {error && <p id={`${name}-error`} className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
