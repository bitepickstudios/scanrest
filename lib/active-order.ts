const KEY_PREFIX = "scanrest:active_order:";

export function setActiveOrder(slug: string, orderId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${slug}`, orderId);
  } catch {}
}

export function getActiveOrder(slug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${KEY_PREFIX}${slug}`);
  } catch {
    return null;
  }
}

export function clearActiveOrder(slug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${KEY_PREFIX}${slug}`);
  } catch {}
}
