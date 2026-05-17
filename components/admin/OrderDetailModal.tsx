"use client";

import { useState } from "react";
import { Phone, User, FileText, Table2, Ban, Check } from "lucide-react";
import { Button, Chip, Modal } from "@heroui/react";
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

const STATUS_CHIP: Record<
  OrderStatus,
  { label: string; color: "default" | "accent" | "success" | "warning" | "danger" }
> = {
  new: { label: "Nuevo", color: "accent" },
  preparing: { label: "Preparando", color: "warning" },
  ready: { label: "Listo", color: "success" },
  delivered: { label: "Entregado", color: "default" },
  cancelled: { label: "Cancelado", color: "danger" },
};

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
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const total = order.order_items.reduce((sum, item) => {
    const mods = (item.order_item_modifiers ?? []).reduce(
      (s, m) => s + m.price_delta,
      0
    );
    return sum + (item.unit_price + mods) * item.quantity;
  }, 0);

  const statusMeta = STATUS_CHIP[order.status] ?? STATUS_CHIP.new;

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <div>
              <Modal.Heading>Pedido #{order.order_number}</Modal.Heading>
              <p className="mt-0.5 text-xs text-neutral-400">
                {new Date(order.created_at).toLocaleString("es-PY")}
              </p>
            </div>
          </Modal.Header>

          <Modal.Body className="space-y-4">
            <div className="flex items-center justify-between">
              <Chip color={statusMeta.color} variant="soft">
                <Chip.Label>{statusMeta.label}</Chip.Label>
              </Chip>
              <span className="text-xs text-neutral-500">
                {order.source === "waiter" ? "vía Mozo" : "vía Cliente"}
              </span>
            </div>

            {mode === "table" && order.tables && (
              <div className="flex items-center gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-white">
                <Table2 size={20} />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/60">
                    Llevar a
                  </p>
                  <p className="text-lg font-bold leading-tight">
                    {order.tables.label || `Mesa ${order.tables.number}`}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2 rounded-xl bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-neutral-400" />
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Phone size={14} className="text-neutral-400" />
                <a href={`tel:${order.customer_phone}`}>
                  {order.customer_phone}
                </a>
              </div>
              {order.customer_ci && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <FileText size={14} className="text-neutral-400" />
                  CI/RUC: {order.customer_ci}
                </div>
              )}
            </div>

            {order.notes && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span className="font-medium">Nota:</span> {order.notes}
              </div>
            )}

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Items
              </h4>
              <div className="space-y-2">
                {order.order_items.map((item) => {
                  const modsTotal = (item.order_item_modifiers ?? []).reduce(
                    (s, m) => s + m.price_delta,
                    0
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-xl border border-neutral-100 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">
                          {item.quantity}× {item.product_name}
                        </p>
                        {(item.order_item_modifiers ?? []).length > 0 && (
                          <p className="mt-0.5 text-xs text-neutral-400">
                            {(item.order_item_modifiers ?? [])
                              .map((m) => m.modifier_name)
                              .join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-xs italic text-neutral-400">
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        Gs.{" "}
                        {(
                          (item.unit_price + modsTotal) *
                          item.quantity
                        ).toLocaleString("es-PY")}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-bold">
                <span>Total</span>
                <span className="tabular-nums">
                  Gs. {total.toLocaleString("es-PY")}
                </span>
              </div>
            </div>

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Cambiar estado
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={order.status === value ? "primary" : "outline"}
                      size="sm"
                      fullWidth
                      onPress={() => {
                        onStatusChange(value);
                        onClose();
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Modal.Body>

          {order.status !== "cancelled" && order.status !== "delivered" && (
            <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              {confirmingCancel ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setConfirmingCancel(false)}
                  >
                    Volver
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onPress={() => {
                      onStatusChange("cancelled");
                      onClose();
                    }}
                  >
                    <Check size={14} /> Confirmar cancelación
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="danger-soft"
                    size="sm"
                    onPress={() => setConfirmingCancel(true)}
                  >
                    <Ban size={14} /> Cancelar pedido
                  </Button>
                  <Button slot="close" variant="ghost" size="sm">
                    Cerrar
                  </Button>
                </>
              )}
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
