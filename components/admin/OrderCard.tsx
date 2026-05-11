"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Table2, ShoppingBag } from "lucide-react";
import type { Order, OrderItem, OrderItemModifier } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export default function OrderCard({
  order,
  mode,
  onSelect,
  isDragging = false,
}: {
  order: OrderFull;
  mode: "table" | "foodcourt";
  onSelect: (order: OrderFull) => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order.id,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const totalItems = order.order_items.reduce((s, i) => s + i.quantity, 0);
  const isUrgent =
    order.status === "new" &&
    Date.now() - new Date(order.created_at).getTime() > 5 * 60 * 1000;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(order)}
      className={`cursor-grab rounded-xl bg-white p-3 shadow-sm transition-shadow select-none ${
        isDragging ? "opacity-50 shadow-lg rotate-1" : "hover:shadow-md"
      } ${isUrgent ? "ring-2 ring-red-400" : ""}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-400">
          #{order.order_number}
        </span>
        <div className="flex items-center gap-1 text-xs text-neutral-400">
          <Clock size={11} />
          {timeAgo(order.created_at)}
        </div>
      </div>

      {/* Customer */}
      <p className="mt-1 text-sm font-semibold text-neutral-800 truncate">
        {order.customer_name}
      </p>

      {/* Table / mode */}
      <div className="mt-1 flex items-center gap-1 text-xs text-neutral-400">
        {mode === "table" ? (
          <>
            <Table2 size={11} />
            {order.table_id ? `Mesa` : "Sin mesa"}
          </>
        ) : (
          <>
            <ShoppingBag size={11} />
            Retiro en mostrador
          </>
        )}
      </div>

      {/* Items summary */}
      <div className="mt-2 border-t border-neutral-100 pt-2">
        <p className="text-xs text-neutral-500 line-clamp-2">
          {order.order_items
            .map((i) => `${i.quantity}× ${i.product_name}`)
            .join(", ")}
        </p>
        <p className="mt-1 text-xs font-medium text-neutral-400">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </p>
      </div>

      {isUrgent && (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-center text-xs font-semibold text-red-600">
          ¡Esperando +5 min!
        </p>
      )}
    </div>
  );
}
