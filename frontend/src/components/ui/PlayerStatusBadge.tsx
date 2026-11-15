import type { PlayerStatus } from '../../api/registrations.ts'

const PLAYER_STATUS: Record<PlayerStatus, { label: string; classes: string; dot: string; hint: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border-warning/30', dot: 'bg-warning', hint: 'Waiting for the auction' },
  sold: { label: 'Sold', classes: 'bg-success-soft text-success border-success/30', dot: 'bg-success', hint: 'Bought by a team' },
  unsold: { label: 'Unsold', classes: 'bg-accent-soft text-accent border-accent/30', dot: 'bg-accent', hint: 'Went through the auction without a buyer' },
  withdrawn: { label: 'Withdrawn', classes: 'bg-surface-2 text-muted border-line-strong', dot: 'bg-subtle', hint: 'Removed from the auction by the organizer' },
}

export const PLAYER_STATUS_LABELS = PLAYER_STATUS

// `key={status}` restarts the small pop animation whenever the status changes.
function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  const style = PLAYER_STATUS[status]
  return (
    <span key={status} title={style.hint} className={`inline-flex animate-status-pop items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  )
}

export default PlayerStatusBadge
