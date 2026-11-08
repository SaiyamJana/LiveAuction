import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// While `dirty` is true:
//  - closing/refreshing the tab shows the browser's "leave site?" prompt, and
//  - clicking any in-app link is intercepted so the page can show its own confirmation.
// (The app uses <BrowserRouter>, which has no built-in navigation blocker.)
export function useUnsavedChangesGuard(dirty: boolean) {
  const navigate = useNavigate()
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  useEffect(() => {
    if (!dirty) return

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      const path = url.pathname + url.search + url.hash
      if (path === window.location.pathname + window.location.search + window.location.hash) return
      event.preventDefault()
      event.stopPropagation()
      setPendingPath(path)
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true) // capture: runs before React Router's own handler
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty])

  const stay = useCallback(() => setPendingPath(null), [])
  const leave = useCallback(() => {
    if (pendingPath) navigate(pendingPath)
    setPendingPath(null)
  }, [navigate, pendingPath])

  return { pendingPath, stay, leave }
}
