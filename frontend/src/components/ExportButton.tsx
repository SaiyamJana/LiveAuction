import { useState } from 'react'
import { useToast } from '../context/toast-context.ts'
import { saveBlob } from '../utils/download.ts'
import { toFormMessage } from '../utils/fieldErrors.ts'
import Button from './ui/Button.tsx'
import { DownloadIcon } from './ui/icons.tsx'

interface ExportButtonProps {
  label?: string
  filename: string
  fetchFile: () => Promise<Blob>
}

// Downloads a file from the API. Shows a spinner while it works, a toast on success or failure,
// and ignores clicks while a download is already running.
function ExportButton({ label = 'Export CSV', filename, fetchFile }: ExportButtonProps) {
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    setBusy(true)
    try {
      saveBlob(await fetchFile(), filename)
      toast(`Downloaded ${filename}`, 'success')
    } catch (error) {
      toast(`Export failed. ${toFormMessage(error)}`, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button variant="secondary" onClick={() => void handleClick()} loading={busy} aria-label={busy ? 'Preparing export' : label}>
      {!busy && <DownloadIcon width={16} height={16} />}
      {busy ? 'Preparing…' : label}
    </Button>
  )
}

export default ExportButton
