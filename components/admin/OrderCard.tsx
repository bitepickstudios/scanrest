"use client";

import { useTransition } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Table2, ShoppingBag, ChefHat, CheckCheck, PackageCheck } from "lucide-react";
import { Button, Chip } from "@heroui/react";
import { updateOrderStatus } from "@/lib/actions/orders";
import type { Order, OrderItem, OrderItemModifier, OrderStatus } from "@/lib/types";

type OrderFull = Order & {
  order_items: (OrderItem & { order_item_modifiers: OrderItemModifier[] })[];
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; icon: typeof ChefHat }>> = {
  new: { status: "preparing", label: "Preparar", icon: ChefHat },
  preparing: { status: "ready", label: "Listo", icon: CheckCheck },
  ready: { status: "delivered", label: "Entregar", icon: PackageCheck },
};

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
  const [isPending, startTransition] = useTransition();

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const totalItems = order.order_items.reduce((s, i) => s + i.quantity, 0);
  const isUrgent =
    order.status === "new" &&
    Date.now() - new Date(order.created_at).getTime() > 5 * 60 * 1000;

  const next = NEXT_STATUS[order.status as OrderStatus];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(order)}
      className={`cursor-grab rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-shadow select-none ${
        isDragging ? "opacity-50 shadow-lg rotate-1" : "hover:shadow-md"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-400">
            #{order.order_number}
          </span>
          {isUrgent && (
            <Chip size="sm" color="warning" variant="soft">
              Urgente
            </Chip>
          )}
        </div>
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
      <div className="mt-1 flex items-center gap-1 text-xs">
        {mode === "table" ? (
          order.tables ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 font-bold text-white">
              <Table2 size={11} />
              {order.tables.label || `Mesa ${order.tables.number}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-neutral-400">
              <Table2 size={11} />
              Sin mesa
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1 text-neutral-400">
            <ShoppingBag size={11} />
            Retiro en mostrador
          </span>
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

      {next && (
        <div
          className="mt-2 border-t border-neutral-100 pt-2"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="ghost"
            fullWidth
            onPress={() => {
              if (!next) return;
              startTransition(async () => {
                await updateOrderStatus(order.id, next.status);
              });
            }}
            isDisabled={isPending}
            className="justify-center gap-1.5"
          >
            <next.icon size={13} />
            {next.label}
          </Button>
        </div>
      )}
    </div>
  );
}
