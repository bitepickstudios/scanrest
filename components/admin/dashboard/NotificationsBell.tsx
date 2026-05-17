"use client";

import { Button, Popover } from "@heroui/react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useOrderNotifications } from "@/lib/stores/order-notifications";

export default function NotificationsBell({
  ordersHref,
}: {
  ordersHref: string;
}) {
  const items = useOrderNotifications((s) => s.items);
  const newOrderCount = useOrderNotifications((s) => s.newOrderCount);
  const markAllRead = useOrderNotifications((s) => s.markAllRead);

  return (
    <Popover onOpenChange={(open) => open && markAllRead()}>
      <Button variant="ghost" isIconOnly aria-label="Notificaciones" className="relative">
        <Bell size={16} />
        {newOrderCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {newOrderCount > 9 ? "9+" : newOrderCount}
          </span>
        )}
      </Button>
      <Popover.Content className="w-80">
        <Popover.Dialog>
          <div className="flex items-center justify-between">
            <Popover.Heading>
              <span className="text-sm font-semibold">Notificaciones</span>
            </Popover.Heading>
            <Link
              href={ordersHref}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              Ver pedidos →
            </Link>
          </div>
          <div className="mt-3 max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">
                Sin notificaciones todavía.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {items.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-2.5">
                    <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-800">
                        Nuevo pedido #{n.orderNumber}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {[
                          n.customerName ?? "Sin nombre",
                          n.source === "waiter" ? "vía mozo" : "vía cliente",
                        ].join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-neutral-400">
                      {timeAgo(n.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
