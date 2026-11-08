import type { TournamentStatus } from '../../api/tournaments.ts'

interface StatusStyle {
  label: string
  classes: string
  dot: string
  description: string
}

export const TOURNAMENT_STATUS: Record<TournamentStatus, StatusStyle> = {
  draft: { label: 'Draft', classes: 'bg-surface-2 text-muted border-line-strong', dot: 'bg-subtle', description: 'Being set up. Not visible to the public yet.' },
  registration_open: { label: 'Registration open', classes: 'bg-success-soft text-success border-success/30', dot: 'bg-success', description: 'Players can register to take part.' },
  registration_closed: { label: 'Registration closed', classes: 'bg-warning-soft text-warning border-warning/30', dot: 'bg-warning', description: 'Registration is over. The auction is next.' },
  auction: { label: 'Auction', classes: 'bg-accent-soft text-accent border-accent/30', dot: 'bg-accent', description: 'Teams are being formed through the auction.' },
  tournament_in_progress: { label: 'In progress', classes: 'bg-primary-soft text-primary border-primary/30', dot: 'bg-primary', description: 'Matches are being played.' },
  completed: { label: 'Completed', classes: 'bg-slate-soft text-fg border-line-strong', dot: 'bg-fg', description: 'The tournament has finished.' },
  cancelled: { label: 'Cancelled', classes: 'bg-danger-soft text-danger border-danger/30', dot: 'bg-danger', description: 'The tournament was cancelled.' },
}

// Order used by the lifecycle stepper (cancelled is a side exit, not a step).
export const LIFECYCLE_STEPS: TournamentStatus[] = [
  'draft',
  'registration_open',
  'registration_closed',
  'auction',
  'tournament_in_progress',
  'completed',
]

function TournamentStatusBadge({ status, size = 'sm' }: { status: TournamentStatus; size?: 'sm' | 'lg' }) {
  const style = TOURNAMENT_STATUS[status]
  const sizing = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${sizing} ${style.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {style.label}
    </span>
  )
}

export default TournamentStatusBadge
