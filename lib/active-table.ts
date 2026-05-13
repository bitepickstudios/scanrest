const KEY_PREFIX = "scanrest:active_table:";
const TTL_MS = 6 * 60 * 60 * 1000;

interface Entry {
  tableId: string;
  ts: number;
}

export function setActiveTable(slug: string, tableId: string) {
  if (typeof window === "undefined") return;
  try {
    const entry: Entry = { tableId, ts: Date.now() };
    localStorage.setItem(`${KEY_PREFIX}${slug}`, JSON.stringify(entry));
  } catch {}
}

export function getActiveTable(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${slug}`);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry;
    if (!entry?.tableId || typeof entry.ts !== "number") return null;
    if (Date.now() - entry.ts > TTL_MS) {
      localStorage.removeItem(`${KEY_PREFIX}${slug}`);
      return null;
    }
    return entry.tableId;
  } catch {
    return null;
  }
}

export function clearActiveTable(slug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${KEY_PREFIX}${slug}`);
  } catch {}
}
