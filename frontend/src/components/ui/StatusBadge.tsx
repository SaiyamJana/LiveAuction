import type { RequestStatus } from '../../api/tournamentRequests.ts'

const STATUS_STYLES: Record<RequestStatus, { label: string; classes: string; dot: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border-warning/30', dot: 'bg-warning' },
  accepted: { label: 'Accepted', classes: 'bg-success-soft text-success border-success/30', dot: 'bg-success' },
  rejected: { label: 'Rejected', classes: 'bg-danger-soft text-danger border-danger/30', dot: 'bg-danger' },
  withdrawn: { label: 'Withdrawn', classes: 'bg-surface-2 text-muted border-line-strong', dot: 'bg-subtle' },
}

export const STATUS_DESCRIPTIONS: Record<RequestStatus, string> = {
  pending: 'Waiting for the owner to review it. You can still withdraw it.',
  accepted: 'Approved. A draft tournament has been created and you are its organizer.',
  rejected: 'The owner declined this request.',
  withdrawn: 'You withdrew this request. It will not be reviewed.',
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  )
}

export default StatusBadge
