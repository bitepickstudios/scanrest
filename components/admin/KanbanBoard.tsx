"use client";

import { useState, useTransition, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/lib/actions/orders";
import KanbanColumn from "./KanbanColumn";
import OrderCard from "./OrderCard";
import OrderDetailModal from "./OrderDetailModal";
import type { Order, OrderItem, OrderItemModifier, OrderStatus } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

const COLUMNS: { id: OrderStatus; label: string; color: string }[] = [
  { id: "new", label: "Nuevos", color: "bg-blue-50 border-blue-200" },
  { id: "preparing", label: "Preparando", color: "bg-amber-50 border-amber-200" },
  { id: "ready", label: "Listos", color: "bg-green-50 border-green-200" },
  { id: "delivered", label: "Entregados", color: "bg-neutral-50 border-neutral-200" },
];

export default function KanbanBoard({
  initialOrders,
  mode,
}: {
  initialOrders: OrderFull[];
  mode: "table" | "foodcourt";
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderFull | null>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) ?? null : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id as string;
    const newStatus = over.id as OrderStatus;
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === newStatus) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
      } catch {
        // Revert on error
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o))
        );
      }
    });
  }

  function handleRefresh() {
    router.refresh();
  }

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-end border-b border-neutral-100 bg-white px-6 py-2">
          <button
            onClick={handleRefresh}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>

        {/* Columns */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-4 overflow-x-auto p-6">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                colorClass={col.color}
                orders={orders.filter((o) => o.status === col.id)}
                mode={mode}
                onSelectOrder={setSelectedOrder}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOrder && (
              <OrderCard
                order={activeOrder}
                mode={mode}
                onSelect={() => {}}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          mode={mode}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(status) => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === selectedOrder.id ? { ...o, status } : o
              )
            );
            setSelectedOrder((prev) =>
              prev ? { ...prev, status } : null
            );
            startTransition(async () => {
              await updateOrderStatus(selectedOrder.id, status);
            });
          }}
        />
      )}
    </>
  );
}
