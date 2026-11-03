import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
  hint?: string
}

function FormField({ label, name, error, hint, ...inputProps }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1 w-full rounded border bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-slate-400 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
        {...inputProps}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField