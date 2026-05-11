"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ChefHat, Bell, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReviewForm from "./ReviewForm";
import type { Order, OrderItem, OrderItemModifier } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

type Restaurant = { name: string; logo_url: string | null; mode: string; id: string };

const steps = (mode: string) => [
  {
    status: "new",
    icon: Bell,
    label: "Pedido recibido",
    sub: "El local recibió tu pedido",
  },
  {
    status: "preparing",
    icon: ChefHat,
    label: "En preparación",
    sub: "Lo están preparando",
  },
  {
    status: "ready",
    icon: CheckCircle2,
    label: mode === "foodcourt" ? "Listo para retirar" : "En camino",
    sub:
      mode === "foodcourt"
        ? "Pasá al mostrador a retirar tu pedido"
        : "Tu pedido ya está en camino a tu mesa",
  },
  {
    status: "delivered",
    icon: PartyPopper,
    label: "Entregado",
    sub: "¡Buen provecho!",
  },
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
}: {
  initialOrder: OrderFull;
  restaurant: Restaurant;
  orderId: string;
}) {
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("status, updated_at")
        .eq("id", orderId)
        .single();
      if (data && data.status !== order.status) {
        setOrder((prev) => ({ ...prev, status: data.status }));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [orderId, order.status]);

  const currentIdx = statusIndex[order.status] ?? 0;
  const stepsConfig = steps(restaurant.mode);

  const total = order.order_items.reduce((sum, item) => {
    const modTotal = (item.order_item_modifiers ?? []).reduce(
      (s, m) => s + m.price_delta,
      0
    );
    return sum + (item.unit_price + modTotal) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Header */}
      <div className="bg-white px-4 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="h-10 w-10 rounded-xl object-cover"
            />
          )}
          <div>
            <p className="text-xs text-neutral-400">{restaurant.name}</p>
            <p className="font-bold">Pedido #{order.order_number}</p>
          </div>
        </div>

        {/* Foodcourt: big order number */}
        {restaurant.mode === "foodcourt" && (
          <div className="mt-4 rounded-2xl bg-neutral-900 py-5 text-center text-white">
            <p className="text-xs uppercase tracking-widest text-neutral-400">
              Tu número de pedido
            </p>
            <p className="mt-1 text-6xl font-black">{order.order_number}</p>
          </div>
        )}
      </div>

      {/* Status stepper */}
      <div className="px-4 pt-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {stepsConfig.map((step, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            const Icon = step.icon;
            return (
              <div key={step.status} className="flex gap-4">
                {/* Icon + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-neutral-900 text-white"
                        : active
                        ? "bg-neutral-900 text-white ring-4 ring-neutral-200"
                        : "bg-neutral-100 text-neutral-300"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  {idx < stepsConfig.length - 1 && (
                    <div
                      className={`my-1 w-0.5 flex-1 min-h-[24px] ${
                        done ? "bg-neutral-900" : "bg-neutral-100"
                      }`}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="pb-5 pt-1">
                  <p
                    className={`text-sm font-semibold ${
                      active
                        ? "text-neutral-900"
                        : done
                        ? "text-neutral-400"
                        : "text-neutral-300"
                    }`}
                  >
                    {step.label}
                  </p>
                  {active && (
                    <p className="mt-0.5 text-xs text-neutral-500">{step.sub}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order summary */}
      <div className="mt-4 px-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-neutral-700">
            Resumen del pedido
          </h3>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <span className="font-medium">
                    {item.quantity}× {item.product_name}
                  </span>
                  {(item.order_item_modifiers ?? []).length > 0 && (
                    <p className="text-xs text-neutral-400">
                      {(item.order_item_modifiers ?? [])
                        .map((m) => m.modifier_name)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <span className="text-neutral-600">
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
          <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 text-sm font-bold">
            <span>Total</span>
            <span>Gs. {total.toLocaleString("es-PY")}</span>
          </div>
        </div>
      </div>

      {order.status !== "delivered" && (
        <p className="mt-4 text-center text-xs text-neutral-400">
          Actualizando automáticamente cada 15 segundos
        </p>
      )}

      {order.status === "delivered" && (
        <div className="mt-4 px-4">
          <ReviewForm
            restaurantId={restaurant.id}
            customerName={order.customer_name}
          />
        </div>
      )}
    </div>
  );
}
