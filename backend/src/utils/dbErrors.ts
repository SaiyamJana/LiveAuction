// MongoDB duplicate-key helpers (error code 11000).
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

// Returns the name of the field whose unique index was violated, e.g. "slug".
export function getDuplicateKeyField(err: unknown): string | undefined {
  if (!isDuplicateKeyError(err)) return undefined;
  const e = err as { keyPattern?: Record<string, unknown>; message?: string };
  const fromPattern = e.keyPattern ? Object.keys(e.keyPattern)[0] : undefined;
  if (fromPattern) return fromPattern;
  // Fallback: 'E11000 duplicate key error ... index: slug_1 dup key: ...'
  const match = /index:\s+(\w+?)_\d+/.exec(e.message ?? "");
  return match?.[1];
}
