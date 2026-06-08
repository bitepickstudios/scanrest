"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";
import { Avatar, Badge, Button, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import BranchSwitcher, { type BranchLite } from "./BranchSwitcher";
import { useOrderNotifications } from "@/lib/stores/order-notifications";
import {
  NAV_SECTIONS,
  RESTAURANT_LEVEL_SEGMENTS,
  buildHref,
  isNavItemActive,
  type NavItem,
} from "./sidebar-nav-config";

export default function Sidebar({
  restaurant,
  ownedCount,
  defaultBranchSlug,
  branches,
}: {
  restaurant: Pick<Restaurant, "name" | "slug" | "logo_url">;
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
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9 rounded-lg ring-1 ring-neutral-200">
            {restaurant.logo_url && (
              <Avatar.Image
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="rounded-lg"
              />
            )}
            <Avatar.Fallback className="rounded-lg bg-neutral-900 text-sm font-bold text-white">
              {restaurant.name.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <p className="flex-1 truncate text-base font-semibold text-neutral-900">
            {restaurant.name}
          </p>
        </div>
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

      <nav className="flex-1 space-y-4 px-2 py-3 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.key} className="space-y-0.5">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {section.label}
            </p>
            {section.items.map((item) => {
              const href = buildHref(item, restBase, branchBase);
              const routeActive = isNavItemActive(item, pathname, restBase, branchBase);
              const active = pendingHref ? pendingHref === href : routeActive;
              const Icon = item.icon;
              const count = badgeValue(item);
              const showBadge = count > 0;
              const linkClass = buttonVariants({
                variant: active ? "primary" : "ghost",
                size: "sm",
                fullWidth: true,
              });
              if (item.comingSoon) {
                return (
                  <div
                    key={item.key}
                    aria-disabled
                    className={`${linkClass} justify-start gap-2 px-3 text-sm font-medium opacity-50 cursor-not-allowed`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    <Badge
                      color="accent"
                      size="sm"
                      variant="soft"
                      className="!static !translate-x-0 !translate-y-0"
                    >
                      Próximamente
                    </Badge>
                  </div>
                );
              }
              return (
                <Link
                  key={item.key}
                  href={href}
                  onClick={() => setPendingHref(href)}
                  className={`${linkClass} justify-start gap-2.5 px-3 text-sm font-medium`}
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
                </Link>
              );
            })}
          </div>
        ))}
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
