"use client";

import { X, Phone, User, FileText } from "lucide-react";
import { Button } from "@heroui/react";
import type { Order, OrderItem, OrderItemModifier, OrderStatus } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
];

export default function OrderDetailModal({
  order,
  mode,
  onClose,
  onStatusChange,
}: {
  order: OrderFull;
  mode: "table" | "foodcourt";
  onClose: () => void;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const total = order.order_items.reduce((sum, item) => {
    const mods = (item.order_item_modifiers ?? []).reduce(
      (s, m) => s + m.price_delta,
      0
    );
    return sum + (item.unit_price + mods) * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[modal-backdrop_0.18s_ease-out]">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold">Pedido #{order.order_number}</h3>
            <p className="text-xs text-neutral-400">
              {new Date(order.created_at).toLocaleString("es-PY")}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-xl bg-neutral-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-neutral-400" />
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Phone size={14} className="text-neutral-400" />
              <a href={`tel:${order.customer_phone}`}>{order.customer_phone}</a>
            </div>
            {order.customer_ci && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <FileText size={14} className="text-neutral-400" />
                CI/RUC: {order.customer_ci}
              </div>
            )}
            {mode === "table" && (
              <p className="text-xs text-neutral-400">
                {order.table_id ? "Mesa asignada" : "Sin mesa (foodcourt)"}
              </p>
            )}
          </div>

          {order.notes && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-medium">Nota:</span> {order.notes}
            </div>
          )}

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Items</h4>
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2 rounded-xl border border-neutral-100 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.quantity}× {item.product_name}</p>
                    {(item.order_item_modifiers ?? []).length > 0 && (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {(item.order_item_modifiers ?? []).map((m) => m.modifier_name).join(", ")}
                      </p>
                    )}
                    {item.notes && (
                      <p className="mt-0.5 text-xs italic text-neutral-400">"{item.notes}"</p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-medium">
                    Gs.{" "}
                    {(
                      (item.unit_price + (item.order_item_modifiers ?? []).reduce((s, m) => s + m.price_delta, 0)) *
                      item.quantity
                    ).toLocaleString("es-PY")}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-bold">
              <span>Total</span>
              <span>Gs. {total.toLocaleString("es-PY")}</span>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Cambiar estado</h4>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={order.status === value ? "primary" : "outline"}
                  size="sm"
                  fullWidth
                  onPress={() => { onStatusChange(value); onClose(); }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
