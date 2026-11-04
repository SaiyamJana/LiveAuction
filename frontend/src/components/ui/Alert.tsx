import type { ReactNode } from 'react'

type Tone = 'error' | 'success' | 'warning' | 'info'

const TONES: Record<Tone, string> = {
  error: 'border-danger/40 bg-danger-soft text-danger',
  success: 'border-success/40 bg-success-soft text-success',
  warning: 'border-warning/40 bg-warning-soft text-warning',
  info: 'border-primary/30 bg-primary-soft text-primary',
}

function Alert({ tone = 'info', children, className = '' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${TONES[tone]} ${className}`}>
      {children}
    </div>
  )
}

export default Alert
