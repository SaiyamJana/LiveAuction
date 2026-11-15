import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { AccountType, RegistrationDto, RegistrationInput } from '../api/registrations.ts'
import { COUNTRIES, findCountry, guessCountryCode } from '../data/countries.ts'
import { toFieldErrors, toFormMessage } from '../utils/fieldErrors.ts'
import type { FieldErrors } from '../utils/fieldErrors.ts'
import Alert from './ui/Alert.tsx'
import Button from './ui/Button.tsx'
import { GemIcon, StarIcon } from './ui/icons.tsx'
import Switch from './ui/Switch.tsx'

interface RegistrationFormProps {
  mode: 'create' | 'resubmit'
  initial?: RegistrationDto
  onSubmit: (input: RegistrationInput) => Promise<void>
  onCancel?: () => void
}

interface Values {
  actualName: string
  displayName: string
  accountType: AccountType | ''
  country: string
  phone: string // national part only; the dial code comes from the country
  wantsCaptain: boolean
}

type Key = 'actualName' | 'displayName' | 'accountType' | 'country' | 'phone'
// Server field names -> form field names.
const SERVER_KEYS: Record<string, Key> = {
  actualName: 'actualName',
  displayName: 'displayName',
  accountType: 'accountType',
  contactCountry: 'country',
  contactNumber: 'phone',
}
const FOCUS_IDS: Record<Key, string> = { actualName: 'actualName', displayName: 'displayName', accountType: 'accountType-star', country: 'country', phone: 'phone' }
const ORDER: Key[] = ['actualName', 'displayName', 'accountType', 'country', 'phone']

function nationalDigits(raw: string): string {
  // Digits only, and drop a single leading 0 (the national "trunk prefix", e.g. 07700 -> 7700).
  return raw.replace(/\D/g, '').replace(/^0/, '')
}

function validate(v: Values): Partial<Record<Key, string>> {
  const e: Partial<Record<Key, string>> = {}
  const actual = v.actualName.trim()
  const display = v.displayName.trim()
  if (!actual) e.actualName = 'Enter your actual name'
  else if (actual.length < 2) e.actualName = 'Actual name must be at least 2 characters'
  else if (actual.length > 80) e.actualName = 'Actual name must be at most 80 characters'

  if (!display) e.displayName = 'Enter the name you want to be shown as'
  else if (display.length < 2) e.displayName = 'Display name must be at least 2 characters'
  else if (display.length > 50) e.displayName = 'Display name must be at most 50 characters'

  if (!v.accountType) e.accountType = 'Choose your account type'
  const country = findCountry(v.country)
  if (!country) e.country = 'Select your country'

  const digits = nationalDigits(v.phone)
  const total = (country?.dial.replace(/\D/g, '').length ?? 0) + digits.length
  if (!digits) e.phone = 'Enter your contact number'
  else if (country && (total < 7 || total > 15)) e.phone = 'Enter a valid phone number for the selected country'
  return e
}

function initialValues(initial?: RegistrationDto): Values {
  if (!initial) return { actualName: '', displayName: '', accountType: '', country: guessCountryCode(), phone: '', wantsCaptain: false }
  const dial = findCountry(initial.contactCountry)?.dial ?? ''
  const phone = dial && initial.contactNumber.startsWith(dial) ? initial.contactNumber.slice(dial.length) : initial.contactNumber.replace(/^\+/, '')
  return {
    actualName: initial.actualName,
    displayName: initial.displayName,
    accountType: initial.accountType,
    country: initial.contactCountry,
    phone,
    wantsCaptain: initial.wantsCaptain,
  }
}

const inputClass = (error?: string) =>
  `mt-1 w-full rounded-lg border bg-surface px-3 py-2 text-fg outline-none transition-colors placeholder:text-subtle hover:border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 ${
    error ? 'border-danger' : 'border-line-strong'
  }`

function Field({ id, label, required, hint, error, children }: { id: string; label: string; required?: boolean; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-fg">
        <span>
          {label}
          {required ? <span className="ml-0.5 text-danger" aria-hidden="true">*</span> : <span className="ml-1.5 text-xs font-normal text-subtle">(optional)</span>}
        </span>
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 animate-fade-in text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-subtle">{hint}</p>
      )}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <legend className="px-2 text-sm font-bold">{title}</legend>
      {description && <p className="-mt-1 mb-4 text-xs text-subtle">{description}</p>}
      <div className="space-y-5">{children}</div>
    </fieldset>
  )
}

const ACCOUNT_OPTIONS: { value: AccountType; label: string; hint: string; icon: ReactNode }[] = [
  { value: 'star', label: 'Star account', hint: 'Your in-game account is a star account.', icon: <StarIcon width={20} height={20} /> },
  { value: 'gem', label: 'Gem account', hint: 'Your in-game account is a gem account.', icon: <GemIcon width={20} height={20} /> },
]

// One form for both "register" and "edit and resubmit". isVerified is deliberately NOT here:
// only the organizer can verify an account.
function RegistrationForm({ mode, initial, onSubmit, onCancel }: RegistrationFormProps) {
  const [values, setValues] = useState<Values>(() => initialValues(initial))
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({})
  const [attempted, setAttempted] = useState(false)
  const [serverErrors, setServerErrors] = useState<Partial<Record<Key, string>>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false) // blocks double clicks / double Enter before React re-renders

  const clientErrors = validate(values)
  const errorFor = (key: Key): string | undefined => serverErrors[key] ?? (touched[key] || attempted ? clientErrors[key] : undefined)
  const country = findCountry(values.country)

  function change<K extends keyof Values>(field: K, value: Values[K], key?: Key) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (key) setServerErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
    setFormError('')
  }
  const blur = (key: Key) => setTouched((prev) => ({ ...prev, [key]: true }))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) return
    setAttempted(true)

    const problems = validate(values)
    const firstBad = ORDER.find((key) => problems[key])
    if (firstBad) {
      document.getElementById(FOCUS_IDS[firstBad])?.focus()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setFormError('')
    setServerErrors({})
    try {
      await onSubmit({
        actualName: values.actualName.trim(),
        displayName: values.displayName.trim(),
        accountType: values.accountType as AccountType,
        contactNumber: `${country!.dial}${nationalDigits(values.phone)}`,
        contactCountry: values.country,
        wantsCaptain: values.wantsCaptain,
      })
    } catch (error) {
      const mapped: Partial<Record<Key, string>> = {}
      for (const [field, message] of Object.entries(toFieldErrors(error) as FieldErrors)) {
        const key = SERVER_KEYS[field]
        if (key) mapped[key] = message
      }
      setServerErrors(mapped)
      if (Object.keys(mapped).length === 0) setFormError(toFormMessage(error))
      else document.getElementById(FOCUS_IDS[ORDER.find((k) => mapped[k]) ?? 'actualName'])?.focus()
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const resubmit = mode === 'resubmit'

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5" aria-busy={submitting}>
      {formError && <Alert tone="error">{formError}</Alert>}

      <Section title="Player details" description="Your actual name is only seen by the organizer. The display name is what appears in the auction.">
        <Field id="actualName" label="Actual name" required error={errorFor('actualName')}>
          <input
            id="actualName"
            name="actualName"
            autoComplete="name"
            value={values.actualName}
            disabled={submitting}
            maxLength={80}
            onChange={(e) => change('actualName', e.target.value, 'actualName')}
            onBlur={() => blur('actualName')}
            aria-invalid={errorFor('actualName') ? true : undefined}
            aria-describedby={errorFor('actualName') ? 'actualName-error' : undefined}
            className={inputClass(errorFor('actualName'))}
            placeholder="e.g. Rohit Sharma"
          />
        </Field>
        <Field id="displayName" label="Display name" required hint="Shown to everyone during the auction." error={errorFor('displayName')}>
          <input
            id="displayName"
            name="displayName"
            value={values.displayName}
            disabled={submitting}
            maxLength={50}
            onChange={(e) => change('displayName', e.target.value, 'displayName')}
            onBlur={() => blur('displayName')}
            aria-invalid={errorFor('displayName') ? true : undefined}
            aria-describedby={errorFor('displayName') ? 'displayName-error' : undefined}
            className={inputClass(errorFor('displayName'))}
            placeholder="e.g. Hitman"
          />
        </Field>
      </Section>

      <Section title="In-game account" description="The organizer will verify your account after you register.">
        <div role="radiogroup" aria-label="Account type" aria-required="true" aria-describedby={errorFor('accountType') ? 'accountType-error' : undefined}>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACCOUNT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-150 has-focus-visible:ring-2 has-focus-visible:ring-primary/40 ${
                  values.accountType === option.value ? 'border-primary bg-primary-soft shadow-card' : 'border-line-strong bg-surface hover:border-subtle hover:bg-surface-2'
                } ${submitting ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  id={`accountType-${option.value}`}
                  type="radio"
                  name="accountType"
                  value={option.value}
                  checked={values.accountType === option.value}
                  disabled={submitting}
                  onChange={() => change('accountType', option.value, 'accountType')}
                  onBlur={() => blur('accountType')}
                  className="sr-only"
                />
                <span className={`mt-0.5 transition-colors ${values.accountType === option.value ? 'text-primary' : 'text-subtle'}`}>{option.icon}</span>
                <span>
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{option.hint}</span>
                </span>
              </label>
            ))}
          </div>
          {errorFor('accountType') && (
            <p id="accountType-error" role="alert" className="mt-2 animate-fade-in text-xs text-danger">
              {errorFor('accountType')}
            </p>
          )}
        </div>
      </Section>

      <Section title="Contact" description="Only the organizer can see your contact number. It is never shown publicly.">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <Field id="country" label="Country" required error={errorFor('country')}>
            <select
              id="country"
              name="country"
              value={values.country}
              disabled={submitting}
              onChange={(e) => change('country', e.target.value, 'country')}
              onBlur={() => blur('country')}
              aria-invalid={errorFor('country') ? true : undefined}
              aria-describedby={errorFor('country') ? 'country-error' : undefined}
              className={inputClass(errorFor('country'))}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.dial})
                </option>
              ))}
            </select>
          </Field>
          <Field id="phone" label="Contact number" required hint="Without the country code." error={errorFor('phone')}>
            <div className={`mt-1 flex overflow-hidden rounded-lg border bg-surface transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${errorFor('phone') ? 'border-danger' : 'border-line-strong'} ${submitting ? 'opacity-60' : ''}`}>
              <span className="flex items-center border-r border-line bg-surface-2 px-3 text-sm font-medium text-muted tabular-nums" aria-hidden="true">
                {country?.dial ?? '+--'}
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={values.phone}
                disabled={submitting}
                maxLength={20}
                onChange={(e) => change('phone', e.target.value.replace(/[^\d\s\-()]/g, ''), 'phone')}
                onBlur={() => blur('phone')}
                aria-invalid={errorFor('phone') ? true : undefined}
                aria-describedby={errorFor('phone') ? 'phone-error' : undefined}
                className="min-w-0 flex-1 bg-transparent px-3 py-2 text-fg outline-none placeholder:text-subtle disabled:cursor-not-allowed"
                placeholder="98765 43210"
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Preferences">
        <Switch
          id="wantsCaptain"
          label="I would like to be considered as a team captain"
          description="Organizers pick captains from players who opted in. This does not guarantee a captaincy."
          checked={values.wantsCaptain}
          disabled={submitting}
          onChange={(checked) => change('wantsCaptain', checked)}
        />
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting} className="min-w-44">
          {submitting ? (resubmit ? 'Resubmitting…' : 'Submitting…') : resubmit ? 'Resubmit for review' : 'Submit registration'}
        </Button>
      </div>
    </form>
  )
}

export default RegistrationForm
