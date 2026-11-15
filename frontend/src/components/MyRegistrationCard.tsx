import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { RegistrationDto, RegistrationStatus } from '../api/registrations.ts'
import { countryName } from '../data/countries.ts'
import { formatDateTime, timeAgo } from '../utils/format.ts'
import Button from './ui/Button.tsx'
import Collapsible from './ui/Collapsible.tsx'
import { AccountTypeChip, VerifiedBadge } from './ui/AccountBadges.tsx'
import { CheckCircleIcon, ChevronDownIcon, ClockIcon, XCircleIcon } from './ui/icons.tsx'
import StatusBadge from './ui/StatusBadge.tsx'

interface MyRegistrationCardProps {
  registration: RegistrationDto
  tournamentName: string
  // Registration still open? (window computed by the server). Needed for the resubmit button.
  registrationOpen: boolean
  closedReason?: string | null
  onEdit?: () => void
  // Short version for the public tournament page; links to `detailsTo` for everything else.
  compact?: boolean
  detailsTo?: string
}

const VIEW: Record<RegistrationStatus, { icon: ReactNode; tone: string; title: string; body: string }> = {
  pending: {
    icon: <ClockIcon width={22} height={22} />,
    tone: 'bg-warning-soft text-warning',
    title: 'Waiting for review',
    body: 'The organizer has your application. You will get a notification as soon as they decide. It cannot be edited while it is under review.',
  },
  accepted: {
    icon: <CheckCircleIcon width={22} height={22} />,
    tone: 'bg-success-soft text-success',
    title: "You're in!",
    body: 'Your registration was accepted and you are now in the player pool. Watch for the auction announcement.',
  },
  rejected: {
    icon: <XCircleIcon width={22} height={22} />,
    tone: 'bg-danger-soft text-danger',
    title: 'Changes needed',
    body: 'The organizer could not accept this registration. Fix the details and resubmit it for another review.',
  },
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium wrap-break-word">{children}</dd>
    </div>
  )
}

// The player's own view of their application. One component for every state; when the status
// changes (for example after a resubmission) it re-plays a short entrance animation.
function MyRegistrationCard({ registration: r, tournamentName, registrationOpen, closedReason, onEdit, compact = false, detailsTo }: MyRegistrationCardProps) {
  const [showDetails, setShowDetails] = useState(!compact)
  const view = VIEW[r.status]
  const canEdit = r.status === 'rejected' && !!onEdit

  return (
    <article key={r.status} aria-label="Your registration" className="animate-status-pop overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className={`flex items-start gap-4 px-5 py-5 sm:px-6 ${view.tone}`}>
        <span className="mt-0.5 shrink-0 rounded-xl bg-surface/70 p-2">{view.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide uppercase opacity-80">Your registration</p>
          <h2 className="mt-0.5 text-xl font-extrabold">{view.title}</h2>
          {!compact && <p className="mt-1 max-w-prose text-sm text-fg/80">{view.body}</p>}
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-subtle">{tournamentName}</p>
            <p className="text-lg font-bold wrap-break-word">{r.displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <AccountTypeChip type={r.accountType} />
            <VerifiedBadge verified={r.isVerified} />
          </div>
        </div>

        {r.response && (
          <div className={`animate-fade-up rounded-xl border px-4 py-3 ${r.status === 'rejected' ? 'border-danger/30 bg-danger-soft' : 'border-line bg-surface-2'}`}>
            <p className={`text-xs font-semibold tracking-wide uppercase ${r.status === 'rejected' ? 'text-danger' : 'text-subtle'}`}>
              {r.status === 'rejected' ? "Organizer's reason" : "Organizer's message"}
            </p>
            <p className="mt-1 text-sm whitespace-pre-wrap wrap-break-word text-fg">{r.response}</p>
          </div>
        )}

        {compact ? (
          <p className="text-sm text-muted">{view.body}</p>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              className="flex w-full items-center justify-between rounded-lg py-1 text-left text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              Registration details
              <ChevronDownIcon width={18} height={18} className={`transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
            </button>
            <Collapsible open={showDetails}>
              <dl className="grid gap-x-6 gap-y-4 border-t border-line pt-4 sm:grid-cols-2">
                <Detail label="Actual name">{r.actualName}</Detail>
                <Detail label="Display name">{r.displayName}</Detail>
                <Detail label="Account type">{r.accountType === 'star' ? 'Star' : 'Gem'}</Detail>
                <Detail label="Contact number">
                  <span className="tabular-nums">{r.contactNumber}</span> <span className="font-normal text-subtle">· {countryName(r.contactCountry)}</span>
                </Detail>
                <Detail label="Captain preference">{r.wantsCaptain ? 'Wants to be considered' : 'Not interested'}</Detail>
                <Detail label="Submitted">
                  {formatDateTime(r.submittedAt)} <span className="font-normal text-subtle">({timeAgo(r.submittedAt)})</span>
                </Detail>
              </dl>
            </Collapsible>
          </div>
        )}

        {/* Next-step area: always tells the player what they can do now. */}
        {r.status === 'rejected' && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {canEdit && (
              <Button onClick={onEdit} disabled={!registrationOpen} title={!registrationOpen ? (closedReason ?? 'Registration is closed') : undefined}>
                Edit and resubmit
              </Button>
            )}
            {!registrationOpen && <p className="text-sm text-danger">{closedReason ?? 'Registration is closed, so this can no longer be resubmitted.'}</p>}
          </div>
        )}
        {r.status !== 'rejected' && !compact && (
          <p className="border-t border-line pt-4 text-xs text-subtle">
            {r.status === 'pending' ? 'Editing is disabled while the organizer reviews your registration.' : 'Accepted registrations are final and can no longer be edited.'}
          </p>
        )}
        {compact && detailsTo && (
          <Link to={detailsTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            {r.status === 'rejected' ? 'Fix and resubmit' : 'View full details'}
          </Link>
        )}
      </div>
    </article>
  )
}

export default MyRegistrationCard
