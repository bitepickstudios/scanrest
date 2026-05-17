"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  ChevronRight,
  ChefHat,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActiveOrders, removeActiveOrder } from "@/lib/active-order";
import { useCartStore } from "@/lib/stores/cart";

type ActiveOrder = {
  id: string;
  orderNumber: number;
  status: string;
};

const STATUS_META: Record<string, { label: string; icon: typeof Bell }> = {
  new: { label: "Pedido recibido", icon: Bell },
  preparing: { label: "En preparación", icon: ChefHat },
  ready: { label: "Listo", icon: CheckCircle2 },
};

const TERMINAL = new Set(["delivered", "cancelled"]);

export default function ActiveOrderBanner({
  slug,
  branchSlug,
}: {
  slug: string;
  branchSlug?: string;
}) {
  const [orders, setOrders] = useState<ActiveOrder[]>([]);
  const hasCart = useCartStore((s) => s.totalItems()) > 0;

  useEffect(() => {
    const ids = getActiveOrders(slug);
    if (ids.length === 0) return;

    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status")
        .in("id", ids);
      if (cancelled || !data) return;

      const next: ActiveOrder[] = [];
      for (const row of data) {
        if (TERMINAL.has(row.status as string)) {
          removeActiveOrder(slug, row.id as string);
        } else {
          next.push({
            id: row.id as string,
            orderNumber: row.order_number as number,
            status: row.status as string,
          });
        }
      }
      const knownIds = new Set(data.map((r) => r.id));
      for (const id of ids) if (!knownIds.has(id)) removeActiveOrder(slug, id);

      next.sort((a, b) => a.orderNumber - b.orderNumber);
      setOrders(next);
    }

    load();

    const channels = ids.map((id) =>
      supabase
        .channel(`active-order-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            if (cancelled) return;
            const row = payload.new as { status?: string; order_number?: number };
            if (!row.status) return;
            if (TERMINAL.has(row.status)) {
              removeActiveOrder(slug, id);
              setOrders((prev) => prev.filter((o) => o.id !== id));
              return;
            }
            setOrders((prev) =>
              prev.map((o) =>
                o.id === id
                  ? {
                      ...o,
                      status: row.status as string,
                      orderNumber:
                        typeof row.order_number === "number"
                          ? row.order_number
                          : o.orderNumber,
                    }
                  : o
              )
            );
          }
        )
        .subscribe()
    );

    return () => {
      cancelled = true;
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [slug]);

  if (orders.length === 0) return null;

  const primary = orders[0];
  const extra = orders.length - 1;
  const meta = STATUS_META[primary.status] ?? STATUS_META.new;
  const Icon = meta.icon;
  const href = branchSlug
    ? `/${slug}/${branchSlug}/order/${primary.id}`
    : `/${slug}`;

  return (
    <div
      className={`fixed left-0 right-0 z-40 px-4 ${
        hasCart ? "bottom-24" : "bottom-6"
      }`}
    >
      <Link href={href} className="block">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--foreground)] px-4 py-3 shadow-xl border border-[var(--border)] active:scale-[0.98] transition-transform animate-slide-up">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
            <span className="absolute inset-0 rounded-xl bg-[var(--accent)] opacity-50 animate-ping" />
            <Icon size={18} className="relative" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-white/60">
              Pedido #{primary.orderNumber} en curso
              {extra > 0 && ` · +${extra} más`}
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {meta.label}
            </p>
          </div>
          <div className="flex items-center gap-1 text-white/80">
            <Receipt size={14} />
            <span className="text-xs font-medium hidden sm:inline">Ver pedido</span>
            <ChevronRight size={16} />
          </div>
        </div>
      </Link>
    </div>
  );
}
