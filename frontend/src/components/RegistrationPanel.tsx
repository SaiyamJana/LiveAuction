import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { PublicTournamentDetail } from '../api/publicTournaments.ts'
import { registrationsApi } from '../api/registrations.ts'
import type { MyRegistrationResponse } from '../api/registrations.ts'
import { useAuth } from '../context/auth-context.ts'
import { formatDateTime } from '../utils/format.ts'
import MyRegistrationCard from './MyRegistrationCard.tsx'
import { ArrowRightIcon, UsersIcon } from './ui/icons.tsx'
import Skeleton from './ui/Skeleton.tsx'

function RegisterCta({ tournament, loggedIn }: { tournament: PublicTournamentDetail; loggedIn: boolean }) {
  const close = tournament.tournament_timeline.registrationClose
  return (
    <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-primary/25 bg-primary-soft px-5 py-5 sm:px-6">
      <div className="flex items-start gap-4">
        <span className="rounded-xl bg-surface p-2.5 text-primary shadow-card">
          <UsersIcon width={22} height={22} />
        </span>
        <div>
          <p className="text-lg font-bold">Registration is open</p>
          <p className="text-sm text-muted">
            {close ? `Sign up as a player before ${formatDateTime(close)}.` : 'Sign up as a player to be part of the auction.'}
            {!loggedIn && ' You will be asked to log in first.'}
          </p>
        </div>
      </div>
      <Link
        to={`/t/${tournament.slug}/register`}
        className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-fg shadow-card transition-[background-color,box-shadow,transform] duration-150 hover:bg-primary-hover hover:shadow-lift active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {loggedIn ? 'Register as a player' : 'Log in to register'}
        <ArrowRightIcon width={18} height={18} className="transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

// Everything a visitor needs to know about registering, on the public tournament page:
// the Register button, or - when they have already registered - their current status.
function RegistrationPanel({ tournament }: { tournament: PublicTournamentDetail }) {
  const { user, loading: authLoading } = useAuth()
  const [mine, setMine] = useState<MyRegistrationResponse | null>(null)
  const [mineState, setMineState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const isPlayerUser = !authLoading && user?.role === 'user'

  useEffect(() => {
    if (!isPlayerUser) return
    const controller = new AbortController()
    setMineState('loading')
    registrationsApi
      .mine(tournament.id, controller.signal)
      .then((data) => {
        setMine(data)
        setMineState('ready')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
        setMineState('error')
      })
    return () => controller.abort()
  }, [isPlayerUser, tournament.id])

  if (authLoading) return <Skeleton className="h-24 w-full rounded-2xl" />

  const open = tournament.status === 'registration_open'

  // Logged out: the CTA sends them to /login and brings them back to the register page.
  if (!user) {
    if (open) return <RegisterCta tournament={tournament} loggedIn={false} />
    return tournament.status === 'registration_closed' ? <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">Registration for this tournament is closed.</p> : null
  }

  if (user.role !== 'user') return null // the global owner never registers as a player

  if (mineState === 'loading' || mineState === 'idle') return <Skeleton className="h-24 w-full rounded-2xl" />
  if (mineState === 'error' || !mine) return <p className="text-sm text-subtle">We couldn't check your registration status right now.</p>

  if (mine.isOrganizer) {
    return (
      <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">
        You organize this tournament.{' '}
        <Link to={`/dashboard/organizer/tournaments/${tournament.id}`} className="font-semibold text-primary hover:underline">
          Manage it
        </Link>
      </p>
    )
  }

  if (mine.registration) {
    return (
      <div className="animate-fade-up">
        <MyRegistrationCard
          registration={mine.registration}
          tournamentName={tournament.name}
          registrationOpen={mine.registrationOpen}
          closedReason={mine.closedReason}
          compact
          detailsTo={`/t/${tournament.slug}/register`}
        />
      </div>
    )
  }

  if (mine.registrationOpen) return <RegisterCta tournament={tournament} loggedIn />
  if (open || tournament.status === 'registration_closed') {
    return <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-muted">{mine.closedReason ?? 'Registration for this tournament is closed.'}</p>
  }
  return null
}

export default RegistrationPanel
