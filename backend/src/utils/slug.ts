import { randomBytes } from "node:crypto";

const MAX_BASE_LENGTH = 60;

// "Summer Cup 2026!" -> "summer-cup-2026"
export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "");
  return slug || "tournament";
}

// Returns a slug that `isTaken` reports as free. Identical names get a short
// random suffix. The unique index on Tournament.slug stays the final authority
// (callers retry on a duplicate-key error), so races are still safe.
export async function generateUniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(name);
  if (!(await isTaken(base))) return base;

  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomBytes(3).toString("hex")}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}${randomBytes(2).toString("hex")}`;
}
