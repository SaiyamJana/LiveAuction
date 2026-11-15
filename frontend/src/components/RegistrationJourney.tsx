import type { RegistrationStatus } from '../api/registrations.ts'
import { CheckIcon, XIcon } from './ui/icons.tsx'

// Where the player is on the road "register -> review -> decision". Used on the register page
// so they always know what happens next.
function RegistrationJourney({ status }: { status: RegistrationStatus | null }) {
  const current = status === null ? 0 : status === 'pending' ? 1 : 2
  const decided = status === 'accepted' || status === 'rejected'
  const steps = [
    { label: 'Register', hint: 'Fill in your details' },
    { label: 'Under review', hint: 'The organizer checks it' },
    { label: status === 'rejected' ? 'Rejected' : status === 'accepted' ? 'Accepted' : 'Decision', hint: status === 'rejected' ? 'Fix it and resubmit' : status === 'accepted' ? 'You are in the player pool' : 'You get a notification' },
  ]

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Registration progress">
      {steps.map((step, index) => {
        const done = index < current || (index === 2 && decided && status === 'accepted')
        const failed = index === 2 && status === 'rejected'
        const active = index === current && !done && !failed
        return (
          <li key={step.label} aria-current={active ? 'step' : undefined}>
            <div className={`h-1.5 rounded-full transition-colors duration-500 ${failed ? 'bg-danger' : done || active ? 'bg-primary' : 'bg-line'} ${active ? 'opacity-60' : ''}`} />
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-500 ${
                  failed ? 'bg-danger text-danger-fg' : done ? 'bg-primary text-primary-fg' : active ? 'bg-primary-soft text-primary ring-2 ring-primary/40' : 'bg-surface-2 text-subtle'
                }`}
              >
                {failed ? <XIcon width={11} height={11} strokeWidth={3} /> : done ? <CheckIcon width={11} height={11} strokeWidth={3} /> : index + 1}
              </span>
              <p className={`text-xs sm:text-sm ${active || done || failed ? 'font-semibold text-fg' : 'text-subtle'}`}>{step.label}</p>
            </div>
            <p className="mt-0.5 hidden pl-7 text-xs text-subtle sm:block">{step.hint}</p>
          </li>
        )
      })}
    </ol>
  )
}

export default RegistrationJourney
