import type { AccountType } from '../../api/registrations.ts'
import { GemIcon, ShieldCheckIcon, StarIcon } from './icons.tsx'

export function AccountTypeChip({ type }: { type: AccountType | null }) {
  if (!type) return <span className="text-subtle">-</span>
  const star = type === 'star'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${star ? 'bg-warning-soft text-warning' : 'bg-accent-soft text-accent'}`}>
      {star ? <StarIcon width={13} height={13} /> : <GemIcon width={13} height={13} />}
      {star ? 'Star' : 'Gem'}
    </span>
  )
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
      <ShieldCheckIcon width={15} height={15} /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-subtle">
      <ShieldCheckIcon width={15} height={15} className="opacity-50" /> Not verified
    </span>
  )
}
