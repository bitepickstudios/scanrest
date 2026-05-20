import type { NavTab } from "./NavTabs";

type SectionTab = NavTab;

export function negocioTabs(restaurantSlug: string): SectionTab[] {
  const base = `/admin/${restaurantSlug}/profile`;
  return [
    { key: "info", label: "Información", href: base, exact: true },
    { key: "sucursales", label: "Sucursales", href: `${base}/sucursales` },
    { key: "equipo", label: "Equipo", href: `${base}/equipo` },
  ];
}

export function menuTabs(restaurantSlug: string, branchSlug: string): SectionTab[] {
  const menuBase = `/admin/${restaurantSlug}/menu`;
  return [
    { key: "items", label: "Items", href: menuBase, exact: true },
    {
      key: "disponibilidad",
      label: "Disponibilidad",
      href: `${menuBase}/disponibilidad/${branchSlug}`,
      matchPaths: [`${menuBase}/disponibilidad`],
    },
  ];
}

