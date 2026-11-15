// Tiny CSV writer (RFC 4180) with spreadsheet formula-injection protection.
// No dependency is needed for this: it is ~40 lines and fully unit-testable.

export type CsvValue = string | number | boolean | Date | null | undefined;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

// A cell that STARTS with one of these characters can be executed as a formula by
// Excel / Sheets / LibreOffice (OWASP "CSV injection"). Tab and carriage return are
// included because spreadsheets also treat them as formula starters.
const FORMULA_START = /^[=+\-@\t\r]/;

// Cells that must be wrapped in double quotes.
const NEEDS_QUOTES = /[",\r\n]/;

// Turns any value into a safe CSV cell.
//  - numbers / booleans / dates are produced by us, so they are never formula risks
//  - strings that could start a formula get a leading apostrophe (shown as plain text)
//  - commas, quotes and line breaks are quoted; quotes are doubled
export function escapeCsvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";

  let text: string;
  if (value instanceof Date) {
    text = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  } else if (typeof value === "string") {
    text = FORMULA_START.test(value) ? `'${value}` : value;
  } else {
    text = String(value);
  }

  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Builds the whole file. CRLF line endings are what the RFC (and Excel) expect, and the
// UTF-8 BOM makes Excel open non-ASCII names (e.g. "Zoë", "रोहित") correctly.
export function toCsv<T>(columns: readonly CsvColumn<T>[], rows: readonly T[]): string {
  const lines = [columns.map((c) => escapeCsvCell(c.header)).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCsvCell(c.value(row))).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
