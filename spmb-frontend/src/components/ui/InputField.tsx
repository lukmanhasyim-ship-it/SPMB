import type { ChangeEvent } from 'react'

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
  options?: { value: string; label: string }[]
  textarea?: boolean
  maxLength?: number
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
  options,
  textarea = false,
  maxLength,
}: InputFieldProps) {
  const inputClass = `w-full px-4 py-2.5 rounded-xl border ${error ? 'border-red-400' : 'border-slate-200'} bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green transition-all duration-200 text-sm ${disabled ? 'bg-slate-50 cursor-not-allowed' : ''}`

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
          className={inputClass}
        />
      )}

      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
