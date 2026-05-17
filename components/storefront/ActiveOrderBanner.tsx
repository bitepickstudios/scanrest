"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, ChevronRight, ChefHat, Bell, CheckCircle2, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getActiveOrder, clearActiveOrder } from "@/lib/active-order";
import { useCartStore } from "@/lib/stores/cart";

const STATUS_META: Record<string, { label: string; icon: typeof Bell }> = {
  new: { label: "Pedido recibido", icon: Bell },
  preparing: { label: "En preparación", icon: ChefHat },
  ready: { label: "Listo", icon: CheckCircle2 },
  delivered: { label: "Entregado", icon: PartyPopper },
};

export default function ActiveOrderBanner({
  slug,
  branchSlug,
}: {
  slug: string;
  branchSlug?: string;
}) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const hasCart = useCartStore((s) => s.totalItems()) > 0;

  useEffect(() => {
    const id = getActiveOrder(slug);
    if (!id) return;
    setOrderId(id);

    const supabase = createClient();
    let cancelled = false;

    async function fetchStatus(currentId: string) {
      const { data, error } = await supabase
        .from("orders")
        .select("status, order_number")
        .eq("id", currentId)
        .single();
      if (cancelled) return;
      if (error || !data) {
        clearActiveOrder(slug);
        setOrderId(null);
        return;
      }
      if (data.status === "delivered") {
        clearActiveOrder(slug);
        setOrderId(null);
        return;
      }
      setStatus(data.status);
      setOrderNumber(data.order_number);
    }

    fetchStatus(id);

    const channel = supabase
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
          const row = payload.new as { status?: string; order_number?: number };
          if (cancelled) return;
          if (row.status === "delivered") {
            clearActiveOrder(slug);
            setOrderId(null);
            return;
          }
          if (row.status) setStatus(row.status);
          if (typeof row.order_number === "number") setOrderNumber(row.order_number);
        }
      )
      .subscribe();

    const interval = setInterval(() => fetchStatus(id), 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [slug]);

  if (!orderId || !status) return null;

  const meta = STATUS_META[status] ?? STATUS_META.new;
  const Icon = meta.icon;

  return (
    <div
      className={`fixed left-0 right-0 z-40 px-4 ${
        hasCart ? "bottom-24" : "bottom-6"
      }`}
    >
      <Link
        href={branchSlug ? `/${slug}/${branchSlug}/order/${orderId}` : `/${slug}`}
        className="block"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--foreground)] px-4 py-3 shadow-xl border border-[var(--border)] active:scale-[0.98] transition-transform animate-slide-up">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
            <span className="absolute inset-0 rounded-xl bg-[var(--accent)] opacity-50 animate-ping" />
            <Icon size={18} className="relative" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-white/60">
              Pedido #{orderNumber} en curso
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
