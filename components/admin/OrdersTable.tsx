"use client";

import { useTransition } from "react";
import { ChefHat, CheckCheck, PackageCheck } from "lucide-react";
import { Button } from "@heroui/react";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { Order, OrderItem, OrderItemModifier, OrderStatus } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

const STATUS_LABEL: Record<string, string> = {
  new: "Nuevo",
  preparing: "Preparando",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_DOT: Record<string, string> = {
  new: "bg-blue-500",
  preparing: "bg-amber-500",
  ready: "bg-emerald-500",
  delivered: "bg-neutral-400",
  cancelled: "bg-rose-500",
};

const NEXT: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: typeof ChefHat }>> = {
  new: { status: "preparing", label: "Preparar", icon: ChefHat },
  preparing: { status: "ready", label: "Listo", icon: CheckCheck },
  ready: { status: "delivered", label: "Entregar", icon: PackageCheck },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString("es-PY");
}

export default function OrdersTable({
  orders,
  mode,
  onSelect,
}: {
  orders: OrderFull[];
  mode: "table" | "foodcourt";
  onSelect: (order: OrderFull) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function advance(order: OrderFull) {
    const next = NEXT[order.status as OrderStatus];
    if (!next) return;
    startTransition(async () => {
      await updateOrderStatus(order.id, next.status);
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">{mode === "table" ? "Mesa" : "Tipo"}</th>
            <th className="px-4 py-3 text-right">Items</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Hora</th>
            <th className="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-neutral-400">
                Sin pedidos.
              </td>
            </tr>
          )}
          {orders.map((o) => {
            const total = o.order_items.reduce(
              (s, i) => s + Number(i.unit_price) * i.quantity,
              0
            );
            const items = o.order_items.reduce((s, i) => s + i.quantity, 0);
            const next = NEXT[o.status as OrderStatus];
            return (
              <tr
                key={o.id}
                className="cursor-pointer hover:bg-neutral-50"
                onClick={() => onSelect(o)}
              >
                <td className="px-4 py-3 font-medium text-neutral-800 tabular-nums">
                  #{o.order_number}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {o.customer_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {mode === "table"
                    ? o.tables
                      ? o.tables.label || `Mesa ${o.tables.number}`
                      : "—"
                    : "Mostrador"}
                </td>
                <td className="px-4 py-3 text-right text-neutral-700 tabular-nums">
                  {items}
                </td>
                <td className="px-4 py-3 text-right font-medium text-neutral-800 tabular-nums">
                  Gs. {total.toLocaleString("es-PY")}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        STATUS_DOT[o.status] ?? "bg-neutral-300"
                      }`}
                    />
                    <span className="text-xs font-medium text-neutral-700">
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">
                  {timeAgo(o.created_at)}
                </td>
                <td
                  className="px-4 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {next && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => advance(o)}
                      isDisabled={isPending}
                      className="gap-1"
                    >
                      <next.icon size={13} />
                      {next.label}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
