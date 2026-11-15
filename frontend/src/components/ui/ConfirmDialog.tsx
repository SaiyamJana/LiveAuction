import type { ReactNode } from 'react'
import Alert from './Alert.tsx'
import Button from './Button.tsx'
import Modal from './Modal.tsx'

interface ConfirmDialogProps {
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  busy?: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

// "Are you sure?" dialog for important or destructive actions. It stays open on failure
// and shows the error inside, so the user never loses context.
function ConfirmDialog({ title, description, confirmLabel, tone = 'primary', busy = false, error, onConfirm, onCancel, children }: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} busy={busy}>
      <div className="mt-2 text-sm text-muted">{description}</div>
      {children}
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
