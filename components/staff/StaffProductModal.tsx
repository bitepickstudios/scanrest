"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button, Chip, Checkbox, Label } from "@heroui/react";
import type { ModifierGroup, Modifier } from "@/lib/types";
import QuantityStepper from "@/components/storefront/QuantityStepper";

export type ProductFull = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  modifier_groups?: (ModifierGroup & { modifiers: Modifier[] })[];
};

export type SelectedModifier = {
  id: string;
  name: string;
  price_delta: number;
};

export default function StaffProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: ProductFull | null;
  onClose: () => void;
  onAdd: (modifiers: SelectedModifier[], quantity: number, note: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setNote("");
      const init: Record<string, string[]> = {};
      (product.modifier_groups ?? []).forEach((g) => {
        init[g.id] = [];
      });
      setSelected(init);
    }
  }, [product]);

  if (!product) return null;
  const groups = product.modifier_groups ?? [];

  function toggleModifier(groupId: string, modId: string, maxSelections: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(modId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== modId) };
      }
      if (maxSelections === 1) {
        return { ...prev, [groupId]: [modId] };
      }
      if (current.length >= maxSelections) return prev;
      return { ...prev, [groupId]: [...current, modId] };
    });
  }

  function canAdd() {
    return groups
      .filter((g) => g.required)
      .every((g) => (selected[g.id]?.length ?? 0) > 0);
  }

  function handleAdd() {
    const mods = groups.flatMap((g) =>
      (g.modifiers ?? [])
        .filter((m) => selected[g.id]?.includes(m.id))
        .map((m) => ({ id: m.id, name: m.name, price_delta: m.price_delta }))
    );
    onAdd(mods, quantity, note);
    onClose();
  }

  const extraPrice = groups
    .flatMap((g) => (g.modifiers ?? []).filter((m) => selected[g.id]?.includes(m.id)))
    .reduce((s, m) => s + m.price_delta, 0);
  const total = (product.price + extraPrice) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-[slide-up_0.22s_cubic-bezier(0.16,1,0.3,1)]">
      <div className="relative h-56 shrink-0 bg-neutral-100">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
        <Button
          isIconOnly
          variant="secondary"
          onPress={onClose}
          className="absolute left-3 top-3 h-9 w-9 rounded-full bg-white/90 shadow"
          aria-label="Cerrar"
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <h2 className="text-xl font-bold">{product.name}</h2>
        {product.description && (
          <p className="mt-1 text-sm text-neutral-500">{product.description}</p>
        )}
        <p className="mt-2 text-base font-bold">
          ₲ {product.price.toLocaleString("es-PY")}
        </p>

        {groups.map((group) => (
          <div key={group.id} className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{group.name}</h3>
              {group.required && (
                <Chip variant="soft" size="sm" className="bg-red-50 text-red-600">
                  Requerido
                </Chip>
              )}
            </div>
            <p className="mb-2 text-xs text-neutral-400">
              {group.max_selections === 1
                ? "Elegí una opción"
                : `Elegí hasta ${group.max_selections}`}
            </p>
            <div className="space-y-1">
              {(group.modifiers ?? []).map((mod) => {
                const isSelected = selected[group.id]?.includes(mod.id) ?? false;
                const checkboxId = `mod-${group.id}-${mod.id}`;
                return (
                  <label
                    key={mod.id}
                    htmlFor={checkboxId}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm hover:bg-neutral-50"
                  >
                    <Checkbox
                      id={checkboxId}
                      isSelected={isSelected}
                      onChange={() =>
                        toggleModifier(group.id, mod.id, group.max_selections)
                      }
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>
                        <Label htmlFor={checkboxId} className="text-neutral-800">
                          {mod.name}
                        </Label>
                      </Checkbox.Content>
                    </Checkbox>
                    {mod.price_delta !== 0 && (
                      <span className="text-neutral-500">
                        {mod.price_delta > 0 ? "+" : ""}₲{" "}
                        {mod.price_delta.toLocaleString("es-PY")}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-5">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Nota (opcional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sin sal, bien cocido..."
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      <div
        className="border-t border-neutral-100 bg-white px-4 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        <div className="flex items-center gap-3">
          <QuantityStepper
            value={quantity}
            onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
            onIncrement={() => setQuantity((q) => q + 1)}
          />
          <Button
            variant="primary"
            onPress={handleAdd}
            isDisabled={!canAdd()}
            className="flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl px-4 text-sm font-semibold"
          >
            <span className="truncate">Agregar al pedido</span>
            <span className="shrink-0 tabular-nums">
              ₲ {total.toLocaleString("es-PY")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
