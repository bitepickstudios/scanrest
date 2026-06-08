function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  headers: { key: keyof T; label: string }[]
): string {
  const head = headers.map((h) => escapeCell(h.label)).join(",");
  const body = rows
    .map((row) => headers.map((h) => escapeCell(row[h.key])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}
