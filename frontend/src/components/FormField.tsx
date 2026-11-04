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
      <label htmlFor={name} className="block text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-fg placeholder:text-subtle outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-danger' : 'border-line-strong'
        }`}
        {...inputProps}
      />
      {hint && !error && <p className="mt-1 text-xs text-subtle">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField