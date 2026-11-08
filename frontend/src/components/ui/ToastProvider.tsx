import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from '../../context/toast-context.ts'
import type { ToastTone } from '../../context/toast-context.ts'
import { AlertIcon, CheckIcon, InfoIcon, XIcon } from './icons.tsx'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

const TONES: Record<ToastTone, { classes: string; icon: ReactNode }> = {
  success: { classes: 'text-success', icon: <CheckIcon width={18} height={18} /> },
  error: { classes: 'text-danger', icon: <AlertIcon width={18} height={18} /> },
  info: { classes: 'text-primary', icon: <InfoIcon width={18} height={18} /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++
      setItems((prev) => [...prev.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3800)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lift"
          >
            <span className={`mt-0.5 shrink-0 ${TONES[item.tone].classes}`}>{TONES[item.tone].icon}</span>
            <p className="min-w-0 flex-1 text-sm text-fg">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-subtle transition-colors hover:text-fg"
            >
              <XIcon width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
