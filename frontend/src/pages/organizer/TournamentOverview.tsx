import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { Timeline } from '../../api/tournaments.ts'
import { CalendarIcon, PhoneIcon, SettingsIcon, UsersIcon } from '../../components/ui/icons.tsx'
import TournamentStatusBadge, { LIFECYCLE_STEPS, TOURNAMENT_STATUS } from '../../components/ui/TournamentStatusBadge.tsx'
import { formatDateTime } from '../../utils/format.ts'
import { useTournament } from './tournamentContext.ts'

export const TIMELINE_LABELS: { key: keyof Timeline; label: string; purpose: string }[] = [
  { key: 'registrationStart', label: 'Registration opens', purpose: 'Players can start registering' },
  { key: 'registrationClose', label: 'Registration closes', purpose: 'Last moment to register' },
  { key: 'auctionStart', label: 'Auction starts', purpose: 'Captains bid for players' },
  { key: 'tournamentStart', label: 'Tournament starts', purpose: 'First match is played' },
]

function Card({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-subtle">{label}</dt>
      <dd className="mt-0.5 text-xl font-bold tabular-nums">{value ?? <span className="text-base font-medium text-subtle">Not set</span>}</dd>
    </div>
  )
}

function TournamentOverview() {
  const { tournament: t } = useTournament()
  const settingsPath = `/dashboard/organizer/tournaments/${t.id}/settings`
  const currentIndex = LIFECYCLE_STEPS.indexOf(t.status)
  const cancelled = t.status === 'cancelled'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">{TOURNAMENT_STATUS[t.status].description}</p>
          <TournamentStatusBadge status={t.status} />
        </div>
        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-6" aria-label="Lifecycle progress">
          {LIFECYCLE_STEPS.map((step, index) => {
            const done = !cancelled && index < currentIndex
            const active = !cancelled && index === currentIndex
            return (
              <li key={step}>
                <div className={`h-1.5 rounded-full transition-colors ${done || active ? 'bg-primary' : 'bg-line'} ${active ? 'opacity-100' : done ? 'opacity-60' : ''}`} />
                <p className={`mt-2 text-xs ${active ? 'font-bold text-fg' : 'text-subtle'}`}>{TOURNAMENT_STATUS[step].label}</p>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 className="text-sm font-bold">About</h2>
        <p className="mt-3 text-sm whitespace-pre-wrap break-words text-muted">{t.description || 'No description yet.'}</p>
        <p className="mt-3 text-xs text-subtle">
          Public address: <span className="font-mono">/t/{t.slug}</span> {t.visibility === 'private' && '(private tournaments are not publicly reachable)'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Timeline" icon={<CalendarIcon width={18} height={18} />}>
          <ol className="relative space-y-4 border-l border-line pl-5">
            {TIMELINE_LABELS.map(({ key, label }) => {
              const value = t.tournament_timeline[key]
              return (
                <li key={key} className="relative">
                  <span className={`absolute top-1 -left-[25px] h-2.5 w-2.5 rounded-full ring-4 ring-surface ${value ? 'bg-primary' : 'bg-line-strong'}`} />
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-subtle">{value ? formatDateTime(value) : 'Not set'}</p>
                </li>
              )
            })}
          </ol>
        </Card>

        <div className="space-y-6">
          <Card title="Teams" icon={<UsersIcon width={18} height={18} />}>
            <dl className="grid grid-cols-3 gap-4">
              <Stat label="Teams" value={t.teamConfig.totalTeams} />
              <Stat label="Min players" value={t.teamConfig.minPlayers} />
              <Stat label="Max players" value={t.teamConfig.maxPlayers} />
            </dl>
          </Card>
          <Card title="Points" icon={<SettingsIcon width={18} height={18} />}>
            <dl className="grid grid-cols-4 gap-4">
              <Stat label="Win" value={t.pointsConfig.win} />
              <Stat label="Loss" value={t.pointsConfig.loss} />
              <Stat label="Tie" value={t.pointsConfig.tie} />
              <Stat label="No result" value={t.pointsConfig.noresult} />
            </dl>
          </Card>
          <Card title="Contact" icon={<PhoneIcon width={18} height={18} />}>
            {t.contact.name || t.contact.phone ? (
              <p className="text-sm">
                <span className="font-semibold">{t.contact.name ?? '—'}</span>
                <span className="text-subtle"> · {t.contact.phone ?? 'no phone'}</span>
              </p>
            ) : (
              <p className="text-sm text-subtle">Not set</p>
            )}
            <p className="mt-2 text-xs text-subtle">Only the contact name is shown publicly. The phone number is never shared.</p>
          </Card>
        </div>
      </div>

      <div className="text-right">
        <Link to={settingsPath} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <SettingsIcon width={16} height={16} /> Edit settings
        </Link>
      </div>
    </div>
  )
}

export default TournamentOverview
