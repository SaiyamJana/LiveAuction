import type { TextareaHTMLAttributes } from 'react'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  name: string
  error?: string
  hint?: string
  counter?: string // e.g. "12 / 2000"
}

function TextAreaField({ label, name, error, hint, counter, className = '', ...rest }: TextAreaFieldProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={name} className="block text-sm font-medium text-fg">
          {label}
        </label>
        {counter && <span className="text-xs text-subtle">{counter}</span>}
      </div>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-fg outline-none placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 ${
          error ? 'border-danger' : 'border-line-strong'
        } ${className}`}
        {...rest}
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

export default TextAreaField
