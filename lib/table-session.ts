const KEY_PREFIX = "scanrest:table_session:";

export function getTableSessionId(slug: string, tableId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${KEY_PREFIX}${slug}:${tableId}`);
  } catch {
    return null;
  }
}

export function setTableSessionId(slug: string, tableId: string, sessionId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${slug}:${tableId}`, sessionId);
  } catch {}
}

export function clearTableSessionId(slug: string, tableId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${KEY_PREFIX}${slug}:${tableId}`);
  } catch {}
}
