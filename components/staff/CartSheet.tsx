"use client";

import { Trash2, Send } from "lucide-react";
import { Button, Drawer, NumberField } from "@heroui/react";

export type CartLine = {
  key: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  modifiers: { name: string; price_delta: number }[];
  notes: string | null;
};

export default function CartSheet({
  isOpen,
  onOpenChange,
  lines,
  total,
  setQty,
  removeLine,
  onSubmit,
  pending,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lines: CartLine[];
  total: number;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog className="max-h-[80vh]">
          <Drawer.Handle />
          <Drawer.Header>
            <Drawer.Heading>Borrador del pedido</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>
            {lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Sin items en el borrador.
              </p>
            ) : (
              <div className="space-y-2">
                {lines.map((l) => (
                  <div
                    key={l.key}
                    className="flex items-start gap-2 rounded-lg bg-neutral-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {l.productName}
                      </p>
                      {l.modifiers.length > 0 && (
                        <p className="truncate text-xs text-neutral-500">
                          {l.modifiers.map((m) => m.name).join(", ")}
                        </p>
                      )}
                      {l.notes && (
                        <p className="truncate text-xs italic text-neutral-400">
                          {l.notes}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-neutral-500">
                        ₲ {l.unitPrice.toLocaleString("es-PY")} c/u
                      </p>
                    </div>
                    <NumberField
                      value={l.quantity}
                      onChange={(n) => setQty(l.key, n ?? 0)}
                      minValue={0}
                      step={1}
                      aria-label={`Cantidad ${l.productName}`}
                    >
                      <NumberField.Group className="w-28">
                        <NumberField.DecrementButton />
                        <NumberField.Input className="w-10 text-center" />
                        <NumberField.IncrementButton />
                      </NumberField.Group>
                    </NumberField>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      isIconOnly
                      onPress={() => removeLine(l.key)}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-neutral-500">Total borrador</span>
                <span className="text-lg font-bold">
                  ₲ {total.toLocaleString("es-PY")}
                </span>
              </div>
              <Button
                variant="primary"
                fullWidth
                isDisabled={lines.length === 0 || pending}
                onPress={() => {
                  onSubmit();
                  onOpenChange(false);
                }}
              >
                <Send size={14} />
                Enviar a cocina
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
