"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Button, SearchField } from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
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
  { id: "cancelled", label: "Cancelados", color: "bg-rose-50 border-rose-200" },
];

export default function KanbanBoard({
  initialOrders,
  mode,
  restaurantId,
}: {
  initialOrders: OrderFull[];
  mode: "table" | "foodcourt";
  restaurantId: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderFull | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dateRange, setDateRange] = useState("today");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    const ranges: Record<string, number | null> = {
      today: 1,
      "7d": 7,
      "30d": 30,
      all: null,
    };
    const days = ranges[dateRange];
    const cutoff =
      days === null
        ? 0
        : days === 1
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : now - days * 86400000;
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (new Date(o.created_at).getTime() < cutoff) return false;
      if (!q) return true;
      const num = String(o.order_number);
      const name = (o.customer_name ?? "").toLowerCase();
      const tableLabel = (o.tables?.label ?? "").toLowerCase();
      return num.includes(q) || name.includes(q) || tableLabel.includes(q);
    });
  }, [orders, dateRange, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`kanban-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { restaurant_id?: string };
          if (row?.restaurant_id !== restaurantId) return;
          router.refresh();
        }
      )
      .subscribe();
    const interval = setInterval(() => router.refresh(), 5000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, router, initialOrders]);

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
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
      } catch {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o))
        );
      }
    });
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 bg-white px-6 py-2.5">
          <div className="w-64">
            <SearchField
              value={search}
              onChange={setSearch}
              aria-label="Buscar pedidos"
              fullWidth
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Buscar por #, cliente, mesa..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <div className="w-36">
            <SelectField
              value={dateRange}
              onChange={setDateRange}
              options={[
                { value: "today", label: "Hoy" },
                { value: "7d", label: "Últimos 7 días" },
                { value: "30d", label: "Últimos 30 días" },
                { value: "all", label: "Todo" },
              ]}
            />
          </div>
          <div className="ml-auto" />
          <Button variant="ghost" size="sm" onPress={() => router.refresh()} isDisabled={isPending}>
            <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-6">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                colorClass={col.color}
                orders={filteredOrders.filter((o) => o.status === col.id)}
                mode={mode}
                onSelectOrder={setSelectedOrder}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOrder && (
              <OrderCard order={activeOrder} mode={mode} onSelect={() => {}} isDragging />
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
              prev.map((o) => (o.id === selectedOrder.id ? { ...o, status } : o))
            );
            setSelectedOrder((prev) => prev ? { ...prev, status } : null);
            startTransition(async () => {
              await updateOrderStatus(selectedOrder.id, status);
            });
          }}
        />
      )}
    </>
  );
}
