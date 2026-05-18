const KEY_PREFIX = "scanrest:customer:";

export type CustomerIdentity = {
  name: string;
  phone: string;
  ci?: string;
};

export function getCustomerIdentity(slug: string): CustomerIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${KEY_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.name !== "string" || typeof parsed?.phone !== "string") return null;
    return {
      name: parsed.name,
      phone: parsed.phone,
      ci: typeof parsed.ci === "string" ? parsed.ci : undefined,
    };
  } catch {
    return null;
  }
}

export function setCustomerIdentity(slug: string, identity: CustomerIdentity) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${KEY_PREFIX}${slug}`, JSON.stringify(identity));
  } catch {}
}

export function clearCustomerIdentity(slug: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${KEY_PREFIX}${slug}`);
  } catch {}
}
