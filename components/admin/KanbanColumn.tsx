"use client";

import { useDroppable } from "@dnd-kit/core";
import OrderCard from "./OrderCard";
import type { Order, OrderItem, OrderItemModifier, OrderStatus } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

export default function KanbanColumn({
  id,
  label,
  colorClass,
  orders,
  mode,
  onSelectOrder,
}: {
  id: OrderStatus;
  label: string;
  colorClass: string;
  orders: OrderFull[];
  mode: "table" | "foodcourt";
  onSelectOrder: (order: OrderFull) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700">{label}</h3>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
          {orders.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-3 rounded-2xl border-2 p-3 transition-colors ${colorClass} ${
          isOver ? "brightness-95" : ""
        } min-h-[200px]`}
      >
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            mode={mode}
            onSelect={onSelectOrder}
          />
        ))}
        {orders.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-neutral-400">Sin pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
}
