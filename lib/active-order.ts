const KEY_PREFIX = "scanrest:active_orders:";
const LEGACY_KEY_PREFIX = "scanrest:active_order:";

function readList(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${slug}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    }
    const legacy = localStorage.getItem(`${LEGACY_KEY_PREFIX}${slug}`);
    if (legacy) {
      writeList(slug, [legacy]);
      localStorage.removeItem(`${LEGACY_KEY_PREFIX}${slug}`);
      return [legacy];
    }
    return [];
  } catch {
    return [];
  }
}

function writeList(slug: string, list: string[]) {
  try {
    localStorage.setItem(`${KEY_PREFIX}${slug}`, JSON.stringify(list));
  } catch {}
}

export function addActiveOrder(slug: string, orderId: string) {
  if (typeof window === "undefined") return;
  const list = readList(slug);
  if (!list.includes(orderId)) writeList(slug, [...list, orderId]);
}

export function getActiveOrders(slug: string): string[] {
  return readList(slug);
}

export function removeActiveOrder(slug: string, orderId: string) {
  if (typeof window === "undefined") return;
  writeList(
    slug,
    readList(slug).filter((id) => id !== orderId)
  );
}

export function getActiveOrder(slug: string): string | null {
  const list = readList(slug);
  return list[list.length - 1] ?? null;
}

export function clearActiveOrder(slug: string, orderId?: string) {
  if (typeof window === "undefined") return;
  if (orderId) {
    removeActiveOrder(slug, orderId);
    return;
  }
  try {
    localStorage.removeItem(`${KEY_PREFIX}${slug}`);
    localStorage.removeItem(`${LEGACY_KEY_PREFIX}${slug}`);
  } catch {}
}

export function setActiveOrder(slug: string, orderId: string) {
  addActiveOrder(slug, orderId);
}
