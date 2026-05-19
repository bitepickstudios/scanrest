"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { Button, Chip } from "@heroui/react";
import BranchSwitcher, { type BranchLite } from "./BranchSwitcher";
import { useOrderNotifications } from "@/lib/stores/order-notifications";
import {
  NAV_ITEMS,
  RESTAURANT_LEVEL_SEGMENTS,
  buildHref,
  type NavItem,
} from "./sidebar-nav-config";

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
  const newOrderCount = useOrderNotifications((s) => s.newOrderCount);
  const resetNotifications = useOrderNotifications((s) => s.reset);
  const restBase = `/admin/${restaurant.slug}`;
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (pathname.includes("/orders") || pathname.includes("/tables")) {
      resetNotifications();
    }
    setPendingHref(null);
  }, [pathname, resetNotifications]);

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

  const badgeValue = (item: NavItem): number => {
    if (item.badgeKey === "newOrders") return newOrderCount;
    return 0;
  };

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
        {NAV_ITEMS.map((item) => {
          const href = buildHref(item, restBase, branchBase);
          const routeActive = item.exact
            ? pathname === href
            : pathname.startsWith(href);
          const active = pendingHref
            ? pendingHref === href
            : routeActive;
          const Icon = item.icon;
          const count = badgeValue(item);
          const showBadge = count > 0;
          return (
            <Button
              key={item.key}
              variant={active ? "primary" : "ghost"}
              size="sm"
              fullWidth
              className="justify-start gap-2.5 px-3 text-sm font-medium"
              render={(props) => (
                <Link
                  {...(props as React.ComponentPropsWithoutRef<typeof Link>)}
                  href={href}
                  onClick={() => setPendingHref(href)}
                />
              )}
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <Chip
                  size="sm"
                  color={active ? "default" : "danger"}
                  variant={active ? "soft" : "primary"}
                >
                  {count > 99 ? "99+" : count}
                </Chip>
              )}
            </Button>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 px-2 py-3">
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onPress={handleLogout}
          className="justify-start gap-2.5 px-3 text-sm font-medium"
        >
          <LogOut size={16} />
          <span className="flex-1 text-left">Cerrar sesión</span>
        </Button>
      </div>
    </aside>
  );
}
