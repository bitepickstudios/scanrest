"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChefHat, Bell, PartyPopper, ArrowLeft, Plus, Table2, Ban } from "lucide-react";
import { Avatar, Button, Modal } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearActiveOrder } from "@/lib/active-order";
import ReviewForm from "./ReviewForm";
import type { Order, OrderItem, OrderItemModifier, OrderStatus } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

type Restaurant = { name: string; logo_url: string | null; mode: string; id: string };

const buildSteps = (mode: string) => [
  { status: "new", icon: Bell, label: "Recibido", sub: "Llegó tu pedido" },
  { status: "preparing", icon: ChefHat, label: "Preparando", sub: "Lo están cocinando" },
  {
    status: "ready",
    icon: CheckCircle2,
    label: mode === "foodcourt" ? "Listo" : "En camino",
    sub:
      mode === "foodcourt"
        ? "Pasá al mostrador"
        : "Va camino a tu mesa",
  },
  { status: "delivered", icon: PartyPopper, label: "Entregado", sub: "¡Buen provecho!" },
];

const statusIndex: Record<string, number> = {
  new: 0,
  preparing: 1,
  ready: 2,
  delivered: 3,
};

export default function OrderTracker({
  initialOrder,
  restaurant,
  orderId,
  slug,
}: {
  initialOrder: OrderFull;
  restaurant: Restaurant;
  orderId: string;
  slug: string;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [cancelledModalOpen, setCancelledModalOpen] = useState(
    initialOrder.status === "cancelled"
  );

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refetch() {
      const { data } = await supabase
        .from("orders")
        .select("status, updated_at")
        .eq("id", orderId)
        .single();
      if (cancelled || !data) return;
      const next = data.status as OrderStatus;
      setOrder((prev) => (prev.status === next ? prev : { ...prev, status: next }));
    }

    refetch();

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const row = payload.new as { id?: string; status?: string };
          if (row.id !== orderId || !row.status) return;
          const next = row.status as OrderStatus;
          setOrder((prev) => (prev.status === next ? prev : { ...prev, status: next }));
        }
      )
      .subscribe();

    const interval = setInterval(refetch, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (order.status === "delivered" || order.status === "cancelled") {
      clearActiveOrder(slug, orderId);
    }
    if (order.status === "cancelled") {
      setCancelledModalOpen(true);
    }
  }, [order.status, slug, orderId]);

  const currentIdx = statusIndex[order.status] ?? 0;
  const stepsConfig = buildSteps(restaurant.mode);

  const total = order.order_items.reduce((sum, item) => {
    const modTotal = (item.order_item_modifiers ?? []).reduce(
      (s, m) => s + m.price_delta,
      0
    );
    return sum + (item.unit_price + modTotal) * item.quantity;
  }, 0);

  const progressPct = (currentIdx / (stepsConfig.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-12">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Link href={`/${slug}`} aria-label="Volver al menú">
            <Button isIconOnly variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft size={18} className="text-[var(--foreground)]" />
            </Button>
          </Link>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Pedido #{order.order_number}
          </p>
        </div>
      </div>

      {/* Restaurant card */}
      <div className="px-4 pt-4 animate-fade-in">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4 shadow-sm border border-[var(--border)]">
          <Avatar size="md" className="h-11 w-11 rounded-xl shrink-0">
            {restaurant.logo_url && (
              <Avatar.Image
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="rounded-xl object-cover"
              />
            )}
            <Avatar.Fallback className="rounded-xl bg-[var(--surface-secondary)] text-sm font-bold text-[var(--muted)]">
              {restaurant.name[0]?.toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--muted)]">Comprando en</p>
            <p className="font-bold text-[var(--foreground)] truncate">{restaurant.name}</p>
          </div>
        </div>
      </div>

      {/* Table info */}
      {restaurant.mode === "table" && order.tables && (
        <div className="px-4 pt-3 animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-4 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-bold">
              {order.tables.number}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Lo llevamos a</p>
              <p className="text-sm font-bold text-[var(--foreground)] truncate">
                {order.tables.label || `Mesa ${order.tables.number}`}
              </p>
            </div>
            <Table2 size={16} className="text-[var(--muted)]" />
          </div>
        </div>
      )}

      {/* Foodcourt: highlighted order number */}
      {restaurant.mode === "foodcourt" && (
        <div className="px-4 pt-4 animate-fade-in">
          <div className="rounded-2xl bg-gradient-to-br from-[var(--foreground)] to-[var(--surface-tertiary)] py-6 text-center shadow-md">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
              Tu número
            </p>
            <p className="mt-1 text-7xl font-black text-white tabular-nums">
              {order.order_number}
            </p>
          </div>
        </div>
      )}

      {order.status === "cancelled" && (
        <div className="px-4 pt-5 animate-fade-in">
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <Ban size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-rose-800">Pedido cancelado</p>
              <p className="mt-0.5 text-xs text-rose-700/80">
                El restaurante canceló este pedido. Si tenés dudas, consultá en el local.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal stepper */}
      {order.status !== "cancelled" && (
      <div className="px-4 pt-5 animate-fade-in">
        <div className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm border border-[var(--border)]">
          <div className="relative">
            {/* Track */}
            <div className="absolute top-5 left-5 right-5 h-1 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {stepsConfig.map((step, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                const Icon = step.icon;
                return (
                  <div
                    key={step.status}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500
                        ${
                          done
                            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                            : active
                            ? "bg-[var(--accent)] text-[var(--accent-foreground)] ring-4 ring-[var(--accent)]/25"
                            : "bg-[var(--surface-tertiary)] text-[var(--muted)]"
                        }`}
                    >
                      {active && (
                        <span className="absolute inset-0 rounded-full bg-[var(--accent)] opacity-60 animate-ping" />
                      )}
                      <Icon size={16} className="relative" />
                    </div>
                    <p
                      className={`text-[10px] sm:text-xs text-center font-semibold leading-tight transition-colors ${
                        active
                          ? "text-[var(--foreground)]"
                          : done
                          ? "text-[var(--foreground)]/70"
                          : "text-[var(--muted)]"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active step subtitle */}
          <div className="mt-5 rounded-xl bg-[var(--accent)]/10 px-4 py-3 text-center animate-fade-in" key={order.status}>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {stepsConfig[currentIdx]?.sub}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Keep ordering CTA */}
      {order.status !== "delivered" && order.status !== "cancelled" && (
        <div className="px-4 pt-4 animate-fade-in">
          <Link href={`/${slug}`} className="block">
            <Button
              variant="secondary"
              className="w-full rounded-2xl py-3.5 h-auto font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <Plus size={16} />
              Hacer otro pedido
            </Button>
          </Link>
        </div>
      )}

      {/* Order summary */}
      <div className="mt-4 px-4 animate-fade-in">
        <div className="rounded-2xl bg-[var(--surface)] p-5 shadow-sm border border-[var(--border)]">
          <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">
            Resumen del pedido
          </h3>
          <div className="space-y-2.5">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-[var(--foreground)]">
                    {item.quantity}× {item.product_name}
                  </span>
                  {(item.order_item_modifiers ?? []).length > 0 && (
                    <p className="text-xs text-[var(--muted)] truncate">
                      {(item.order_item_modifiers ?? [])
                        .map((m) => m.modifier_name)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-[var(--foreground)]/70 tabular-nums shrink-0">
                  Gs.{" "}
                  {(
                    (item.unit_price +
                      (item.order_item_modifiers ?? []).reduce(
                        (s, m) => s + m.price_delta,
                        0
                      )) *
                    item.quantity
                  ).toLocaleString("es-PY")}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-[var(--border)] pt-3 text-sm font-bold text-[var(--foreground)]">
            <span>Total</span>
            <span className="tabular-nums">Gs. {total.toLocaleString("es-PY")}</span>
          </div>
        </div>
      </div>

      {order.status !== "delivered" && order.status !== "cancelled" && (
        <p className="mt-4 text-center text-xs text-[var(--muted)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse mr-1.5 align-middle" />
          Actualizando en vivo
        </p>
      )}

      {order.status === "delivered" && (
        <div className="mt-4 px-4 animate-fade-in">
          <ReviewForm
            restaurantId={restaurant.id}
            customerName={order.customer_name}
          />
        </div>
      )}

      <Modal.Backdrop
        isOpen={cancelledModalOpen && order.status === "cancelled"}
        onOpenChange={setCancelledModalOpen}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.Header>
              <Modal.Icon className="bg-rose-100 text-rose-700">
                <Ban className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Tu pedido fue cancelado</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-[var(--muted)]">
                El restaurante canceló tu pedido #{order.order_number}. Si tenés
                dudas, consultá directamente en el local.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                variant="primary"
                onPress={() => {
                  setCancelledModalOpen(false);
                  router.push(`/${slug}`);
                }}
              >
                Ir al menú
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
