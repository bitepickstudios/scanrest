"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button, Chip, Checkbox, Label, NumberField } from "@heroui/react";
import { useCartStore } from "@/lib/stores/cart";
import type { Product, ModifierGroup, Modifier } from "@/lib/types";
import QuantityStepper from "./QuantityStepper";

type ProductFull = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};

export default function ProductModal({
  product,
  onClose,
  editKey,
  initialQuantity,
  initialNote,
  initialModifierIds,
}: {
  product: ProductFull;
  onClose: () => void;
  editKey?: string;
  initialQuantity?: number;
  initialNote?: string;
  initialModifierIds?: string[];
}) {
  const addItem = useCartStore((s) => s.addItem);
  const updateItemAction = useCartStore((s) => s.updateItem);
  const [quantity, setQuantity] = useState(initialQuantity ?? 1);
  const [note, setNote] = useState(initialNote ?? "");
  // selectedQty: map of modifierId -> quantity selected (0 = not selected)
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    const preset = new Set(initialModifierIds ?? []);
    product.modifier_groups.forEach((g) => {
      (g.modifiers ?? []).forEach((m) => {
        init[m.id] = preset.has(m.id) ? 1 : 0;
      });
    });
    return init;
  });

  function setQty(modId: string, qty: number) {
    setSelectedQty((prev) => ({ ...prev, [modId]: Math.max(0, qty) }));
  }

  function groupSelectionCount(group: ModifierGroup & { modifiers?: Modifier[] }) {
    return (group.modifiers ?? []).filter((m) => (selectedQty[m.id] ?? 0) > 0).length;
  }

  function toggleSingle(groupId: string, modId: string, maxSelections: number) {
    setSelectedQty((prev) => {
      const next = { ...prev };
      const current = next[modId] ?? 0;
      const group = product.modifier_groups.find((g) => g.id === groupId);
      if (current > 0) {
        next[modId] = 0;
        return next;
      }
      if (maxSelections === 1 && group) {
        group.modifiers?.forEach((m) => {
          next[m.id] = 0;
        });
      } else if (group) {
        const selectedCount = (group.modifiers ?? []).filter(
          (m) => (next[m.id] ?? 0) > 0
        ).length;
        if (selectedCount >= maxSelections) return prev;
      }
      next[modId] = 1;
      return next;
    });
  }

  function canAdd() {
    return product.modifier_groups
      .filter((g) => g.required)
      .every((g) => groupSelectionCount(g) > 0);
  }

  function handleAdd() {
    const selectedModifiers = product.modifier_groups.flatMap((g) =>
      (g.modifiers ?? [])
        .filter((m) => (selectedQty[m.id] ?? 0) > 0)
        .map((m) => ({
          id: m.id,
          name: m.name,
          price_delta: m.price_delta,
          quantity: selectedQty[m.id] ?? 1,
        }))
    );
    if (editKey) {
      updateItemAction(editKey, product, selectedModifiers, quantity, note);
    } else {
      addItem(product, selectedModifiers, quantity, note);
    }
    onClose();
  }

  const extraPrice = product.modifier_groups
    .flatMap((g) => g.modifiers ?? [])
    .reduce((s, m) => s + m.price_delta * (selectedQty[m.id] ?? 0), 0);

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
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <h2 className="text-xl font-bold">{product.name}</h2>
        {product.description && (
          <p className="mt-1 text-sm text-neutral-500">{product.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <p className="text-base font-bold">
            Gs. {product.price.toLocaleString("es-PY")}
          </p>
          {product.calories != null && (
            <Chip variant="soft" size="sm" className="text-neutral-500">
              <Chip.Label>{product.calories} kcal</Chip.Label>
            </Chip>
          )}
        </div>

        {(product.ingredients?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Ingredientes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {product.ingredients!.map((ing) => (
                <Chip key={ing} variant="soft" size="sm">
                  <Chip.Label>{ing}</Chip.Label>
                </Chip>
              ))}
            </div>
          </div>
        )}

        {product.modifier_groups.map((group) => (
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
              {group.modifiers?.map((mod) => {
                const qty = selectedQty[mod.id] ?? 0;
                const maxPerItem = mod.max_per_item ?? 1;
                const checkboxId = `mod-${group.id}-${mod.id}`;
                if (maxPerItem > 1) {
                  return (
                    <div
                      key={mod.id}
                      className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-neutral-800">{mod.name}</p>
                        {mod.price_delta !== 0 && (
                          <p className="text-xs text-neutral-500">
                            {mod.price_delta > 0 ? "+" : ""}Gs.{" "}
                            {mod.price_delta.toLocaleString("es-PY")} c/u
                          </p>
                        )}
                      </div>
                      <NumberField
                        value={qty}
                        onChange={(v) => setQty(mod.id, v ?? 0)}
                        minValue={0}
                        maxValue={maxPerItem}
                        className="w-28"
                      >
                        <NumberField.Group>
                          <NumberField.DecrementButton />
                          <NumberField.Input />
                          <NumberField.IncrementButton />
                        </NumberField.Group>
                      </NumberField>
                    </div>
                  );
                }
                return (
                  <label
                    key={mod.id}
                    htmlFor={checkboxId}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm hover:bg-neutral-50"
                  >
                    <Checkbox
                      id={checkboxId}
                      isSelected={qty > 0}
                      onChange={() =>
                        toggleSingle(group.id, mod.id, group.max_selections)
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
                        {mod.price_delta > 0 ? "+" : ""}Gs.{" "}
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
            <span className="truncate">
              {editKey ? "Guardar cambios" : "Agregar al pedido"}
            </span>
            <span className="shrink-0 tabular-nums">
              Gs. {total.toLocaleString("es-PY")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
