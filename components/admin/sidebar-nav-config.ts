import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  SlidersHorizontal,
  Star,
  Store,
  Table2,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";

export const RESTAURANT_LEVEL_SEGMENTS = new Set([
  "profile",
  "menu",
  "sucursales",
  "settings",
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
}

export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Inicio", icon: LayoutDashboard, level: "branch", path: "", exact: true },
  { key: "profile", label: "Perfil", icon: Store, level: "restaurant", path: "/profile" },
  { key: "sucursales", label: "Sucursales", icon: MapPin, level: "restaurant", path: "/sucursales" },
  { key: "menu", label: "Menú", icon: UtensilsCrossed, level: "restaurant", path: "/menu" },
  { key: "zones", label: "Zonas", icon: LayoutGrid, level: "branch", path: "/zones" },
  { key: "tables", label: "Mesas", icon: Table2, level: "branch", path: "/tables" },
  { key: "menu-overrides", label: "Disponibilidad", icon: SlidersHorizontal, level: "branch", path: "/menu-overrides" },
  { key: "orders", label: "Pedidos", icon: ClipboardList, level: "branch", path: "/orders", badgeKey: "newOrders" },
  { key: "reservations", label: "Reservas", icon: CalendarDays, level: "branch", path: "/reservations" },
  { key: "reviews", label: "Reseñas", icon: Star, level: "branch", path: "/reviews" },
  { key: "staff", label: "Equipo", icon: Users, level: "restaurant", path: "/settings/staff" },
];

export function buildHref(item: NavItem, restBase: string, branchBase: string): string {
  const base = item.level === "branch" ? branchBase : restBase;
  return `${base}${item.path}`;
}
