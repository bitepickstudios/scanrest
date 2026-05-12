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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { Button } from "@heroui/react";

export default function Sidebar({
  restaurant,
  ownedCount,
}: {
  restaurant: Pick<Restaurant, "name" | "slug">;
  ownedCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/admin/${restaurant.slug}`;

  const navItems = [
    { href: base, label: "Inicio", icon: LayoutDashboard, exact: true },
    { href: `${base}/profile`, label: "Perfil", icon: Store },
    { href: `${base}/menu`, label: "Menú", icon: UtensilsCrossed },
    { href: `${base}/tables`, label: "Mesas", icon: Table2 },
    { href: `${base}/orders`, label: "Pedidos", icon: ClipboardList },
    { href: `${base}/reviews`, label: "Reseñas", icon: Star },
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
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeftRight size={11} />
            Cambiar local
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-3">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
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
