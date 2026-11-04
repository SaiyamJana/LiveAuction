import { useEffect, useId, useRef, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications.ts'
import { formatDateTime, timeAgo } from '../utils/format.ts'
import Alert from './ui/Alert.tsx'
import Button from './ui/Button.tsx'
import { BellIcon, CheckIcon, InboxIcon } from './ui/icons.tsx'

function NotificationBell() {
  const { items, unreadCount, hasMore, status, error, loadingMore, markingAll, retry, loadMore, markRead, markAllRead } =
    useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const badge = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-primary"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-danger-fg">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-fg">Notifications</h2>
            <Button variant="ghost" size="sm" onClick={() => void markAllRead()} disabled={unreadCount === 0} loading={markingAll}>
              <CheckIcon width={14} height={14} />
              Mark all as read
            </Button>
          </div>

          {error && status === 'ready' && (
            <div className="px-4 pt-3">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {status === 'loading' && <p className="px-4 py-8 text-center text-sm text-muted">Loading notifications...</p>}

            {status === 'error' && (
              <div className="space-y-3 px-4 py-6 text-center">
                <Alert tone="error">{error}</Alert>
                <Button variant="secondary" size="sm" onClick={retry}>
                  Try again
                </Button>
              </div>
            )}

            {status === 'ready' && items.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted">
                <InboxIcon width={28} height={28} className="text-subtle" />
                <p className="text-sm">You are all caught up. No notifications yet.</p>
              </div>
            )}

            {status === 'ready' && items.length > 0 && (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const unread = n.readAt === null
                  return (
                    <li key={n.id} className={`flex gap-3 px-4 py-3 ${unread ? 'bg-primary-soft' : ''}`}>
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${unread ? 'bg-primary' : 'bg-transparent'}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`break-words text-sm ${unread ? 'font-semibold text-fg' : 'text-muted'}`}>{n.body}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <time dateTime={n.createdAt} title={formatDateTime(n.createdAt)} className="text-xs text-subtle">
                            {timeAgo(n.createdAt)}
                          </time>
                          {unread ? (
                            <button
                              type="button"
                              onClick={() => void markRead(n.id)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <span className="text-xs text-subtle">Read</span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {status === 'ready' && hasMore && (
              <div className="border-t border-line p-3 text-center">
                <Button variant="secondary" size="sm" onClick={() => void loadMore()} loading={loadingMore}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
