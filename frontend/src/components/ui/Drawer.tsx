import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { XIcon } from './icons.tsx'

interface DrawerProps {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  busy?: boolean // while true the drawer cannot be dismissed
  footer?: ReactNode
  children: ReactNode
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Right-hand detail panel (bottom-aligned full width on phones). Accessible like <Modal>:
// Escape closes, focus is trapped and restored, page scroll is locked. It slides in and out;
// `onClose` is called AFTER the exit animation so the parent can simply unmount it.
function Drawer({ title, subtitle, onClose, busy = false, footer, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [closing, setClosing] = useState(false)

  const requestClose = useCallback(() => {
    if (!busy) setClosing(true)
  }, [busy])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // A confirmation dialog on top handles its own Escape first.
        if (document.querySelector('[aria-modal="true"]:not([data-drawer])') ) return
        requestClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      if (document.querySelector('[aria-modal="true"]:not([data-drawer])')) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [requestClose])

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-end bg-overlay backdrop-blur-[2px] ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose()
      }}
    >
      <div
        ref={panelRef}
        data-drawer=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onAnimationEnd={(event) => {
          if (closing && event.target === event.currentTarget) onClose()
        }}
        className={`flex h-full w-full max-w-xl flex-col border-l border-line bg-surface shadow-lift outline-none ${closing ? 'animate-drawer-out' : 'animate-drawer-in'}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold break-words">
              {title}
            </h2>
            {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Close panel"
            className="shrink-0 rounded-lg p-1.5 text-subtle transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <XIcon width={18} height={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <footer className="border-t border-line bg-surface-2/60 px-6 py-4">{footer}</footer>}
      </div>
    </div>
  )
}

export default Drawer
