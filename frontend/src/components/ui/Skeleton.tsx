// Shimmering placeholder block. Size it with classes: <Skeleton className="h-4 w-32" />
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export default Skeleton
