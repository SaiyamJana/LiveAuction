import type { ReactNode } from 'react'

// Smooth height animation without measuring: a one-row grid that goes from 0fr to 1fr.
// Hidden content is also removed from the tab order (inert) so keyboard users cannot reach it.
function Collapsible({ open, children, className = '' }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} ${className}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

export default Collapsible
