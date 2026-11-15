interface Tab<T extends string> {
  value: T
  label: string
  count?: number
}

// Segmented filter with count pills (used by the registrations and players tables).
function FilterTabs<T extends string>({ tabs, value, onChange, label }: { tabs: Tab<T>[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
              active ? 'bg-primary text-primary-fg shadow-card' : 'text-muted hover:bg-surface-2 hover:text-fg'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${active ? 'bg-white/20 text-primary-fg' : 'bg-surface-2 text-subtle'}`}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default FilterTabs
