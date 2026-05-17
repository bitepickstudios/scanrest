"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  Table2,
  ClipboardList,
  Star,
  LogOut,
  ArrowLeftRight,
  MapPin,
  Users,
  LayoutGrid,
  SlidersHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { Button } from "@heroui/react";
import BranchSwitcher, { type BranchLite } from "./BranchSwitcher";

export default function Sidebar({
  restaurant,
  ownedCount,
  defaultBranchSlug,
  branches,
}: {
  restaurant: Pick<Restaurant, "name" | "slug">;
  ownedCount: number;
  defaultBranchSlug?: string;
  branches: BranchLite[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const restBase = `/admin/${restaurant.slug}`;
  const RESTAURANT_LEVEL_SEGMENTS = new Set([
    "profile",
    "menu",
    "sucursales",
    "settings",
  ]);
  const pathSegments = pathname.split("/").filter(Boolean);
  const rawSegment =
    pathSegments[0] === "admin" && pathSegments[1] === restaurant.slug
      ? pathSegments[2]
      : undefined;
  const currentBranchSlug =
    rawSegment && !RESTAURANT_LEVEL_SEGMENTS.has(rawSegment)
      ? rawSegment
      : undefined;
  const branchSlug = currentBranchSlug ?? defaultBranchSlug;
  const branchBase = branchSlug ? `${restBase}/${branchSlug}` : restBase;

  const navItems = [
    { href: branchBase, label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: `${restBase}/profile`, label: "Perfil", icon: Store },
    { href: `${restBase}/sucursales`, label: "Sucursales", icon: MapPin },
    { href: `${restBase}/menu`, label: "Menú", icon: UtensilsCrossed },
    { href: `${branchBase}/zones`, label: "Zonas", icon: LayoutGrid },
    { href: `${branchBase}/tables`, label: "Mesas", icon: Table2 },
    { href: `${branchBase}/menu-overrides`, label: "Disponibilidad", icon: SlidersHorizontal },
    { href: `${branchBase}/orders`, label: "Pedidos", icon: ClipboardList },
    { href: `${branchBase}/reviews`, label: "Reseñas", icon: Star },
    { href: `${restBase}/settings/staff`, label: "Equipo", icon: Users },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-5">
        <Image
          src="/scanrest.svg"
          alt="ScanRest"
          width={2051}
          height={437}
          priority
          className="h-5 w-auto"
        />
        <p className="mt-2 truncate text-sm font-semibold text-neutral-800">
          {restaurant.name}
        </p>
        {ownedCount > 1 && (
          <Link
            href="/auth/select-restaurant"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeftRight size={11} />
            Cambiar local
          </Link>
        )}
        <div className="mt-3">
          <BranchSwitcher
            restaurantSlug={restaurant.slug}
            branches={branches}
            currentBranchSlug={branchSlug}
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 px-2 py-3">
        <Button
          variant="ghost"
          onPress={handleLogout}
          className="w-full justify-start gap-2.5 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
