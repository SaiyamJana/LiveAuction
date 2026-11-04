import { useCallback, useEffect, useRef, useState } from 'react'
import { notificationsApi } from '../api/notifications.ts'
import type { NotificationItem } from '../api/notifications.ts'
import { toFormMessage } from '../utils/fieldErrors.ts'

const POLL_INTERVAL_MS = 30_000
const PAGE_SIZE = 10

type Status = 'loading' | 'ready' | 'error'

// Polls /api/notifications every 30 s while the tab is visible. The interval is
// cleared on unmount (logout), and a poll is skipped while another request is running.
export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const nextPageRef = useRef(2) // next page "load more" will request
  const inFlightRef = useRef(false)
  const aliveRef = useRef(true)

  // Newest page: merged into what is already shown, so extra loaded pages are kept.
  const refresh = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      const data = await notificationsApi.list(1, PAGE_SIZE)
      if (!aliveRef.current) return
      const fresh = data.notifications
      const freshIds = new Set(fresh.map((n) => n.id))
      setItems((previous) => [...fresh, ...previous.filter((n) => !freshIds.has(n.id))])
      setUnreadCount(data.unreadCount)
      if (nextPageRef.current === 2) setHasMore(data.hasMore)
      setError('')
      setStatus('ready')
    } catch (err) {
      if (!aliveRef.current) return
      setError(toFormMessage(err))
      setStatus((previous) => (previous === 'ready' ? 'ready' : 'error'))
    } finally {
      inFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    aliveRef.current = true
    void refresh()

    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, POLL_INTERVAL_MS)

    function onVisibility() {
      if (!document.hidden) void refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      aliveRef.current = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refresh])

  const retry = useCallback(() => {
    setStatus('loading')
    void refresh()
  }, [refresh])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const data = await notificationsApi.list(nextPageRef.current, PAGE_SIZE)
      if (!aliveRef.current) return
      nextPageRef.current += 1
      setItems((previous) => {
        const known = new Set(previous.map((n) => n.id))
        return [...previous, ...data.notifications.filter((n) => !known.has(n.id))]
      })
      setHasMore(data.hasMore)
      setUnreadCount(data.unreadCount)
      setError('')
    } catch (err) {
      if (aliveRef.current) setError(toFormMessage(err))
    } finally {
      if (aliveRef.current) setLoadingMore(false)
    }
  }, [hasMore, loadingMore])

  const markRead = useCallback(async (id: string) => {
    try {
      const data = await notificationsApi.markRead(id)
      if (!aliveRef.current) return
      setItems((previous) => previous.map((n) => (n.id === id ? data.notification : n)))
      setUnreadCount(data.unreadCount)
      setError('')
    } catch (err) {
      if (aliveRef.current) setError(toFormMessage(err))
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead()
      if (!aliveRef.current) return
      const now = new Date().toISOString()
      setItems((previous) => previous.map((n) => (n.readAt ? n : { ...n, readAt: now })))
      setUnreadCount(0)
      setError('')
    } catch (err) {
      if (aliveRef.current) setError(toFormMessage(err))
    } finally {
      if (aliveRef.current) setMarkingAll(false)
    }
  }, [])

  return { items, unreadCount, hasMore, status, error, loadingMore, markingAll, retry, loadMore, markRead, markAllRead }
}
