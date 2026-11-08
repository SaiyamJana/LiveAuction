import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { tournamentsApi } from '../../api/tournaments.ts'
import type { TournamentDetail, UpdateTournamentInput, Visibility } from '../../api/tournaments.ts'
import Alert from '../../components/ui/Alert.tsx'
import Button from '../../components/ui/Button.tsx'
import { AlertIcon, CalendarIcon, EyeOffIcon, GlobeIcon, LockIcon, PhoneIcon, SettingsIcon, TrophyIcon, UsersIcon } from '../../components/ui/icons.tsx'
import Modal from '../../components/ui/Modal.tsx'
import { useToast } from '../../context/toast-context.ts'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard.ts'
import { toFieldErrors, toFormMessage } from '../../utils/fieldErrors.ts'
import type { FieldErrors } from '../../utils/fieldErrors.ts'
import { formatDateTime, fromLocalInput, toLocalInput } from '../../utils/format.ts'
import { useTournament } from './tournamentContext.ts'

// ---------- form model ----------
// Everything is a string while editing (that is what inputs give us); converted when saving.
interface FormState {
  name: string
  description: string
  visibility: Visibility
  contactName: string
  contactPhone: string
  totalTeams: string
  minPlayers: string
  maxPlayers: string
  win: string
  loss: string
  tie: string
  noresult: string
  registrationStart: string
  registrationClose: string
  auctionStart: string
  tournamentStart: string
}
type Key = keyof FormState

// Form key -> the dotted path the backend uses in its field errors.
const PATH: Record<Key, string> = {
  name: 'name',
  description: 'description',
  visibility: 'visibility',
  contactName: 'contact.name',
  contactPhone: 'contact.phone',
  totalTeams: 'teamConfig.totalTeams',
  minPlayers: 'teamConfig.minPlayers',
  maxPlayers: 'teamConfig.maxPlayers',
  win: 'pointsConfig.win',
  loss: 'pointsConfig.loss',
  tie: 'pointsConfig.tie',
  noresult: 'pointsConfig.noresult',
  registrationStart: 'tournament_timeline.registrationStart',
  registrationClose: 'tournament_timeline.registrationClose',
  auctionStart: 'tournament_timeline.auctionStart',
  tournamentStart: 'tournament_timeline.tournamentStart',
}

type SectionId = 'basics' | 'contact' | 'teams' | 'points' | 'timeline'

const SECTIONS: { id: SectionId; label: string; blurb: string; icon: ReactNode; keys: Key[] }[] = [
  { id: 'basics', label: 'Basics', blurb: 'Name, description and who can see it', icon: <SettingsIcon width={18} height={18} />, keys: ['name', 'description', 'visibility'] },
  { id: 'contact', label: 'Contact', blurb: 'Who players should reach out to', icon: <PhoneIcon width={18} height={18} />, keys: ['contactName', 'contactPhone'] },
  { id: 'teams', label: 'Teams', blurb: 'How many teams and squad sizes', icon: <UsersIcon width={18} height={18} />, keys: ['totalTeams', 'minPlayers', 'maxPlayers'] },
  { id: 'points', label: 'Points', blurb: 'Points awarded for each result', icon: <TrophyIcon width={18} height={18} />, keys: ['win', 'loss', 'tie', 'noresult'] },
  { id: 'timeline', label: 'Timeline', blurb: 'Key dates, in chronological order', icon: <CalendarIcon width={18} height={18} />, keys: ['registrationStart', 'registrationClose', 'auctionStart', 'tournamentStart'] },
]

const TEAM_KEYS: Key[] = ['totalTeams', 'minPlayers', 'maxPlayers']
const POINT_KEYS: Key[] = ['win', 'loss', 'tie', 'noresult']
const TIMELINE_KEYS = ['registrationStart', 'registrationClose', 'auctionStart', 'tournamentStart'] as const

const str = (n: number | null) => (n === null ? '' : String(n))

function toForm(t: TournamentDetail): FormState {
  return {
    name: t.name,
    description: t.description,
    visibility: t.visibility,
    contactName: t.contact.name ?? '',
    contactPhone: t.contact.phone ?? '',
    totalTeams: str(t.teamConfig.totalTeams),
    minPlayers: str(t.teamConfig.minPlayers),
    maxPlayers: str(t.teamConfig.maxPlayers),
    win: str(t.pointsConfig.win),
    loss: str(t.pointsConfig.loss),
    tie: str(t.pointsConfig.tie),
    noresult: str(t.pointsConfig.noresult),
    registrationStart: toLocalInput(t.tournament_timeline.registrationStart),
    registrationClose: toLocalInput(t.tournament_timeline.registrationClose),
    auctionStart: toLocalInput(t.tournament_timeline.auctionStart),
    tournamentStart: toLocalInput(t.tournament_timeline.tournamentStart),
  }
}

// ---------- client-side validation (mirrors the backend; the backend stays the authority) ----------
function wholeNumber(value: string, label: string, min: number, max: number): string | undefined {
  if (value.trim() === '') return undefined
  const n = Number(value)
  if (!Number.isInteger(n)) return `${label} must be a whole number`
  if (n < min) return `${label} must be at least ${min}`
  if (n > max) return `${label} must be at most ${max}`
  return undefined
}

function validate(form: FormState, base: FormState, locked: boolean): FieldErrors {
  const e: FieldErrors = {}
  const set = (k: Key, m: string | undefined) => {
    if (m) e[k] = m
  }

  const name = form.name.trim()
  if (name.length < 3) e.name = 'Name must be at least 3 characters'
  else if (name.length > 100) e.name = 'Name must be at most 100 characters'
  if (form.description.length > 3000) e.description = 'Description must be at most 3000 characters'

  if (form.contactName.trim() === '' && base.contactName !== '') e.contactName = 'Contact name cannot be empty once set'
  else if (form.contactName.trim() !== '' && form.contactName.trim().length < 2) e.contactName = 'Contact name must be at least 2 characters'
  if (form.contactPhone.trim() === '' && base.contactPhone !== '') e.contactPhone = 'Phone number cannot be empty once set'
  else if (form.contactPhone.trim() !== '' && !/^\+?[0-9][0-9\s\-().]{5,19}$/.test(form.contactPhone.trim())) {
    e.contactPhone = 'Enter a valid phone number (6-20 digits, may start with +)'
  }

  if (!locked) {
    set('totalTeams', wholeNumber(form.totalTeams, 'Total teams', 2, 32))
    set('minPlayers', wholeNumber(form.minPlayers, 'Minimum players', 1, 50))
    set('maxPlayers', wholeNumber(form.maxPlayers, 'Maximum players', 1, 50))
    for (const k of TEAM_KEYS) if (form[k].trim() === '' && base[k] !== '') e[k] = 'Cannot be empty once set'
    if (!e.minPlayers && !e.maxPlayers && form.minPlayers && form.maxPlayers && Number(form.minPlayers) > Number(form.maxPlayers)) {
      e.minPlayers = 'Minimum players cannot be greater than maximum players'
    }
    const labels: Record<string, string> = { win: 'Win points', loss: 'Loss points', tie: 'Tie points', noresult: 'No-result points' }
    for (const k of POINT_KEYS) {
      set(k, wholeNumber(form[k], labels[k], 0, 100))
      if (form[k].trim() === '' && base[k] !== '') e[k] = 'Cannot be empty once set'
    }
  }

  // Each date must come after the closest earlier date that is set.
  let previous: { key: Key; time: number } | null = null
  for (const key of TIMELINE_KEYS) {
    if (!form[key]) continue
    const time = new Date(form[key]).getTime()
    if (Number.isNaN(time)) {
      e[key] = 'Enter a valid date and time'
      continue
    }
    if (previous) {
      const strict = key === 'registrationClose'
      if (strict ? time <= previous.time : time < previous.time) {
        e[key] = key === 'registrationClose' ? 'Registration must close after it opens' : key === 'auctionStart' ? 'The auction cannot start before registration closes' : 'The tournament cannot start before the auction'
      }
    }
    previous = { key, time }
  }
  return e
}

// Only what changed is sent: the backend treats the request as a partial update.
function buildPayload(form: FormState, base: FormState, locked: boolean): UpdateTournamentInput {
  const changed = (k: Key) => form[k] !== base[k]
  const p: UpdateTournamentInput = {}
  if (changed('name')) p.name = form.name.trim()
  if (changed('description')) p.description = form.description.trim()
  if (changed('visibility')) p.visibility = form.visibility

  const contact: NonNullable<UpdateTournamentInput['contact']> = {}
  if (changed('contactName')) contact.name = form.contactName.trim()
  if (changed('contactPhone')) contact.phone = form.contactPhone.trim()
  if (Object.keys(contact).length) p.contact = contact

  if (!locked) {
    const teams: NonNullable<UpdateTournamentInput['teamConfig']> = {}
    for (const k of ['totalTeams', 'minPlayers', 'maxPlayers'] as const) if (changed(k)) teams[k] = Number(form[k])
    if (Object.keys(teams).length) p.teamConfig = teams
    const points: NonNullable<UpdateTournamentInput['pointsConfig']> = {}
    for (const k of ['win', 'loss', 'tie', 'noresult'] as const) if (changed(k)) points[k] = Number(form[k])
    if (Object.keys(points).length) p.pointsConfig = points
  }

  const timeline: NonNullable<UpdateTournamentInput['tournament_timeline']> = {}
  for (const k of TIMELINE_KEYS) if (changed(k)) timeline[k] = fromLocalInput(form[k]) // null clears the date
  if (Object.keys(timeline).length) p.tournament_timeline = timeline
  return p
}

// ---------- small presentational pieces ----------
interface FieldProps {
  id: Key
  label: string
  hint?: string
  error?: string
  locked?: boolean
  children: ReactNode
}

function Field({ id, label, hint, error, locked, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-fg">
        {label}
        {locked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
            <LockIcon width={10} height={10} /> Locked
          </span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-subtle">{hint}</p>
      )}
    </div>
  )
}

const inputClass = (error?: string) =>
  `w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg outline-none transition-shadow placeholder:text-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-subtle ${
    error ? 'border-danger' : 'border-line-strong'
  }`

function SectionHeader({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="mb-6 border-b border-line pb-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted">{blurb}</p>
    </div>
  )
}

const TIMELINE_INFO: Record<(typeof TIMELINE_KEYS)[number], { label: string; purpose: string }> = {
  registrationStart: { label: 'Registration opens', purpose: 'The day players can start registering.' },
  registrationClose: { label: 'Registration closes', purpose: 'The last moment players can register. Must be after it opens.' },
  auctionStart: { label: 'Auction starts', purpose: 'When team captains start bidding for players.' },
  tournamentStart: { label: 'Tournament starts', purpose: 'When the first match is played.' },
}

// ---------- page ----------
function TournamentSettings() {
  const { tournament, onTournamentChange } = useTournament()
  const { toast } = useToast()
  const locked = tournament.locks.teamAndPoints

  const [base, setBase] = useState<FormState>(() => toForm(tournament))
  const [form, setForm] = useState<FormState>(() => toForm(tournament))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [section, setSection] = useState<SectionId>('basics')

  const dirtyKeys = useMemo(() => (Object.keys(form) as Key[]).filter((k) => form[k] !== base[k]), [form, base])
  const dirty = dirtyKeys.length > 0
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  const { pendingPath, stay, leave } = useUnsavedChangesGuard(dirty)

  // Pick up fresh server data (for example after a status change) unless the user is mid-edit.
  useEffect(() => {
    if (dirtyRef.current) return
    const fresh = toForm(tournament)
    setBase(fresh)
    setForm(fresh)
  }, [tournament])

  function update<K extends Key>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const text = (key: Key) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(key, event.target.value as never)

  function sectionOf(key: Key): SectionId {
    return SECTIONS.find((s) => s.keys.includes(key))!.id
  }

  async function save() {
    const clientErrors = validate(form, base, locked)
    const clientKeys = Object.keys(clientErrors) as Key[]
    if (clientKeys.length > 0) {
      setErrors(clientErrors)
      setSection(sectionOf(clientKeys[0]))
      setFormError('Please fix the highlighted fields.')
      return
    }

    const payload = buildPayload(form, base, locked)
    if (Object.keys(payload).length === 0) return

    setSaving(true)
    setFormError('')
    setErrors({})
    try {
      const data = await tournamentsApi.update(tournament.id, payload)
      const fresh = toForm(data.tournament)
      setBase(fresh)
      setForm(fresh)
      onTournamentChange(data.tournament)
      toast('Settings saved', 'success')
    } catch (err) {
      // The form keeps everything the user typed.
      const server = toFieldErrors(err)
      const mapped: FieldErrors = {}
      for (const key of Object.keys(PATH) as Key[]) if (server[PATH[key]]) mapped[key] = server[PATH[key]]
      setErrors(mapped)
      const firstKey = (Object.keys(mapped) as Key[])[0]
      if (firstKey) setSection(sectionOf(firstKey))
      const message = toFormMessage(err)
      setFormError(firstKey ? 'Some settings were rejected. See the highlighted fields.' : message)
      toast(firstKey ? 'Some settings were rejected' : message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setForm(base)
    setErrors({})
    setFormError('')
  }

  const sectionDirty = (id: SectionId) => SECTIONS.find((s) => s.id === id)!.keys.some((k) => dirtyKeys.includes(k))
  const sectionError = (id: SectionId) => SECTIONS.find((s) => s.id === id)!.keys.some((k) => errors[k])
  const active = SECTIONS.find((s) => s.id === section)!

  const lockedBanner = locked && (
    <Alert tone="info" className="mb-6 flex items-start gap-2">
      <LockIcon width={16} height={16} className="mt-0.5 shrink-0" />
      <span>The auction has started, so these rules are locked and can no longer be changed.</span>
    </Alert>
  )

  return (
    <div className="pb-24">
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <nav aria-label="Settings sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {SECTIONS.map((s) => {
            const isActive = s.id === section
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                {s.icon}
                <span className="flex-1">{s.label}</span>
                {sectionError(s.id) ? (
                  <span className="h-2 w-2 rounded-full bg-danger" title="Has errors" />
                ) : (
                  sectionDirty(s.id) && <span className="h-2 w-2 rounded-full bg-warning" title="Unsaved changes" />
                )}
              </button>
            )
          })}
        </nav>

        <div key={section} className="min-w-0 animate-fade-up rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <SectionHeader title={active.label} blurb={active.blurb} />
          {formError && <Alert tone="error" className="mb-6">{formError}</Alert>}

          {section === 'basics' && (
            <div className="space-y-6">
              <Field id="name" label="Tournament name" hint="Shown everywhere. The public web address does not change when you rename." error={errors.name}>
                <input id="name" value={form.name} onChange={text('name')} maxLength={100} aria-invalid={errors.name ? true : undefined} className={inputClass(errors.name)} />
              </Field>
              <Field id="description" label="Description" hint={`${form.description.length} / 3000`} error={errors.description}>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={text('description')}
                  rows={6}
                  placeholder="Tell players what this tournament is about: format, rules, prizes..."
                  aria-invalid={errors.description ? true : undefined}
                  className={inputClass(errors.description)}
                />
              </Field>
              <fieldset>
                <legend className="text-sm font-medium">Visibility</legend>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                  {(['public', 'private'] as const).map((v) => {
                    const selected = form.visibility === v
                    return (
                      <label
                        key={v}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                          selected ? 'border-primary bg-primary-soft/60 ring-2 ring-primary/20' : 'border-line-strong hover:border-primary/40'
                        }`}
                      >
                        <input type="radio" name="visibility" value={v} checked={selected} onChange={() => update('visibility', v)} className="sr-only" />
                        <span className={selected ? 'text-primary' : 'text-subtle'}>{v === 'public' ? <GlobeIcon /> : <EyeOffIcon />}</span>
                        <span>
                          <span className="block text-sm font-semibold capitalize">{v}</span>
                          <span className="block text-xs text-muted">
                            {v === 'public' ? 'Listed on the public tournaments page once it leaves draft.' : 'Hidden from the public pages, even for people who know the link.'}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
                {errors.visibility && <p className="mt-1.5 text-xs text-danger">{errors.visibility}</p>}
              </fieldset>
            </div>
          )}

          {section === 'contact' && (
            <div className="space-y-6">
              <Field id="contactName" label="Contact person" hint="Shown on the public tournament page." error={errors.contactName}>
                <input id="contactName" value={form.contactName} onChange={text('contactName')} maxLength={80} autoComplete="off" aria-invalid={errors.contactName ? true : undefined} className={inputClass(errors.contactName)} />
              </Field>
              <Field id="contactPhone" label="Phone number" hint="Private: only you can see this. It is never shown publicly." error={errors.contactPhone}>
                <input id="contactPhone" type="tel" value={form.contactPhone} onChange={text('contactPhone')} placeholder="+91 98765 43210" autoComplete="off" aria-invalid={errors.contactPhone ? true : undefined} className={inputClass(errors.contactPhone)} />
              </Field>
              <p className="text-xs text-subtle">A contact name and phone number are required before registration can open.</p>
            </div>
          )}

          {section === 'teams' && (
            <div>
              {lockedBanner}
              <div className="grid gap-6 sm:grid-cols-3">
                <Field id="totalTeams" label="Total teams" hint="2 to 32" error={errors.totalTeams} locked={locked}>
                  <input id="totalTeams" type="number" inputMode="numeric" min={2} max={32} value={form.totalTeams} onChange={text('totalTeams')} disabled={locked} aria-invalid={errors.totalTeams ? true : undefined} className={inputClass(errors.totalTeams)} />
                </Field>
                <Field id="minPlayers" label="Min players per team" hint="Smallest squad allowed" error={errors.minPlayers} locked={locked}>
                  <input id="minPlayers" type="number" inputMode="numeric" min={1} max={50} value={form.minPlayers} onChange={text('minPlayers')} disabled={locked} aria-invalid={errors.minPlayers ? true : undefined} className={inputClass(errors.minPlayers)} />
                </Field>
                <Field id="maxPlayers" label="Max players per team" hint="Largest squad allowed" error={errors.maxPlayers} locked={locked}>
                  <input id="maxPlayers" type="number" inputMode="numeric" min={1} max={50} value={form.maxPlayers} onChange={text('maxPlayers')} disabled={locked} aria-invalid={errors.maxPlayers ? true : undefined} className={inputClass(errors.maxPlayers)} />
                </Field>
              </div>
            </div>
          )}

          {section === 'points' && (
            <div>
              {lockedBanner}
              <div className="grid gap-6 sm:grid-cols-2">
                {([
                  ['win', 'Win', 'Points for the winning team'],
                  ['loss', 'Loss', 'Points for the losing team'],
                  ['tie', 'Tie', 'Points each team gets in a tie'],
                  ['noresult', 'No result', 'Points each team gets when no result is possible'],
                ] as const).map(([key, label, hint]) => (
                  <Field key={key} id={key} label={`${label} points`} hint={hint} error={errors[key]} locked={locked}>
                    <input id={key} type="number" inputMode="numeric" min={0} max={100} value={form[key]} onChange={text(key)} disabled={locked} aria-invalid={errors[key] ? true : undefined} className={inputClass(errors[key])} />
                  </Field>
                ))}
              </div>
            </div>
          )}

          {section === 'timeline' && (
            <ol className="space-y-5">
              {TIMELINE_KEYS.map((key, index) => (
                <li key={key} className="flex gap-4">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Field id={key} label={TIMELINE_INFO[key].label} hint={TIMELINE_INFO[key].purpose} error={errors[key]}>
                      <div className="flex gap-2">
                        <input id={key} type="datetime-local" value={form[key]} onChange={text(key)} aria-invalid={errors[key] ? true : undefined} className={inputClass(errors[key])} />
                        {form[key] && (
                          <Button variant="secondary" size="sm" onClick={() => update(key, '')} aria-label={`Clear ${TIMELINE_INFO[key].label}`}>
                            Clear
                          </Button>
                        )}
                      </div>
                    </Field>
                    {form[key] && !errors[key] && <p className="mt-1 text-xs text-subtle">{formatDateTime(fromLocalInput(form[key]))}</p>}
                  </div>
                </li>
              ))}
              <li className="text-xs text-subtle">Dates must be in the order shown. Leave a date empty if it is not decided yet.</li>
            </ol>
          )}
        </div>
      </div>

      {/* Save bar: slides in as soon as something changes */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 animate-slide-up border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <AlertIcon width={16} height={16} className="text-warning" />
              You have unsaved changes
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={discard} disabled={saving}>
                Discard
              </Button>
              <Button onClick={() => void save()} loading={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingPath && (
        <Modal title="Leave without saving?" onClose={stay}>
          <p className="mt-2 text-sm text-muted">You have unsaved changes to these settings. If you leave now they will be lost.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={stay}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={leave}>
              Leave page
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default TournamentSettings
