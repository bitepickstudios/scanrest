import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Star,
  Store,
  Table2,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const RESTAURANT_LEVEL_SEGMENTS = new Set([
  "profile",
  "menu",
]);

export type NavLevel = "restaurant" | "branch";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  level: NavLevel;
  path: string;
  exact?: boolean;
  badgeKey?: "newOrders";
  matchPaths?: string[];
  comingSoon?: boolean;
}

export interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    key: "operacion",
    label: "Operación",
    items: [
      { key: "home", label: "Inicio", icon: LayoutDashboard, level: "branch", path: "", exact: true },
      { key: "orders", label: "Pedidos", icon: ClipboardList, level: "branch", path: "/orders", badgeKey: "newOrders" },
      { key: "tables", label: "Mesas", icon: Table2, level: "branch", path: "/tables" },
      { key: "reservations", label: "Reservas", icon: CalendarDays, level: "branch", path: "/reservations", comingSoon: true },
    ],
  },
  {
    key: "catalogo",
    label: "Catálogo",
    items: [
      { key: "menu", label: "Menú", icon: UtensilsCrossed, level: "restaurant", path: "/menu" },
      { key: "reviews", label: "Reseñas", icon: Star, level: "branch", path: "/reviews" },
    ],
  },
  {
    key: "negocio",
    label: "Negocio",
    items: [
      { key: "profile", label: "Perfil", icon: Store, level: "restaurant", path: "/profile" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export function buildHref(item: NavItem, restBase: string, branchBase: string): string {
  const base = item.level === "branch" ? branchBase : restBase;
  return `${base}${item.path}`;
}

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  restBase: string,
  branchBase: string,
): boolean {
  const paths = item.matchPaths ?? [item.path];
  return paths.some((p) => {
    const base = item.level === "branch" ? branchBase : restBase;
    const full = `${base}${p}`;
    if (item.exact && p === item.path) return pathname === full;
    return pathname === full || pathname.startsWith(`${full}/`);
  });
}
