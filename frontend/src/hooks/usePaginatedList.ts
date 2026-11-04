import { useCallback, useEffect, useRef, useState } from 'react'
import { toFormMessage } from '../utils/fieldErrors.ts'

export interface PageResult<T, M> {
  items: T[]
  hasMore: boolean
  meta?: M
}

type Status = 'loading' | 'ready' | 'error'

// Loads page 1 whenever `fetchPage` changes (wrap it in useCallback with the filter as a
// dependency), supports "load more", and can silently refresh page 1 after a mutation.
export function usePaginatedList<T extends { id: string }, M = undefined>(
  fetchPage: (page: number, signal: AbortSignal) => Promise<PageResult<T, M>>,
) {
  const [items, setItems] = useState<T[]>([])
  const [meta, setMeta] = useState<M | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)

  const pageRef = useRef(1)
  const controllerRef = useRef<AbortController | null>(null)

  const loadFirst = useCallback(
    async (silent: boolean) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      if (!silent) {
        setStatus('loading')
        setItems([])
        setError('')
      }
      try {
        const result = await fetchPage(1, controller.signal)
        if (controller.signal.aborted) return
        setItems(result.items)
        setMeta(result.meta)
        setHasMore(result.hasMore)
        pageRef.current = 1
        setError('')
        setStatus('ready')
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        setError(toFormMessage(err))
        setStatus((previous) => (previous === 'ready' ? 'ready' : 'error'))
      }
    },
    [fetchPage],
  )

  useEffect(() => {
    void loadFirst(false)
    return () => controllerRef.current?.abort()
  }, [loadFirst])

  const reload = useCallback(() => loadFirst(true), [loadFirst])
  const retry = useCallback(() => loadFirst(false), [loadFirst])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    const controller = controllerRef.current ?? new AbortController()
    setLoadingMore(true)
    try {
      const result = await fetchPage(pageRef.current + 1, controller.signal)
      if (controller.signal.aborted) return
      pageRef.current += 1
      setItems((previous) => {
        const known = new Set(previous.map((item) => item.id))
        return [...previous, ...result.items.filter((item) => !known.has(item.id))]
      })
      setHasMore(result.hasMore)
      setError('')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(toFormMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }, [fetchPage, hasMore, loadingMore])

  return { items, meta, hasMore, status, error, loadingMore, loadMore, reload, retry }
}
