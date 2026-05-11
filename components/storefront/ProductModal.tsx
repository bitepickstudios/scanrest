"use client";

import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import type { Product, ModifierGroup, Modifier } from "@/lib/types";

type ProductFull = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};

export default function ProductModal({
  product,
  onClose,
}: {
  product: ProductFull;
  onClose: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    product.modifier_groups.forEach((g) => { init[g.id] = []; });
    return init;
  });

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
    return product.modifier_groups
      .filter((g) => g.required)
      .every((g) => (selected[g.id]?.length ?? 0) > 0);
  }

  function handleAdd() {
    const selectedModifiers = product.modifier_groups.flatMap((g) =>
      (g.modifiers ?? [])
        .filter((m) => selected[g.id]?.includes(m.id))
        .map((m) => ({ id: m.id, name: m.name, price_delta: m.price_delta }))
    );
    addItem(product, selectedModifiers, quantity, note);
    onClose();
  }

  const extraPrice = product.modifier_groups.flatMap((g) =>
    (g.modifiers ?? []).filter((m) => selected[g.id]?.includes(m.id))
  ).reduce((s, m) => s + m.price_delta, 0);

  const total = (product.price + extraPrice) * quantity;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header image */}
      <div className="relative h-56 shrink-0 bg-neutral-100">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
        <button
          onClick={onClose}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <h2 className="text-xl font-bold">{product.name}</h2>
        {product.description && (
          <p className="mt-1 text-sm text-neutral-500">{product.description}</p>
        )}
        <p className="mt-2 text-base font-bold">
          Gs. {product.price.toLocaleString("es-PY")}
        </p>

        {/* Modifier groups */}
        {product.modifier_groups.map((group) => (
          <div key={group.id} className="mt-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{group.name}</h3>
              {group.required && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                  Requerido
                </span>
              )}
            </div>
            <p className="mb-2 text-xs text-neutral-400">
              {group.max_selections === 1
                ? "Elegí una opción"
                : `Elegí hasta ${group.max_selections}`}
            </p>
            <div className="space-y-2">
              {group.modifiers?.map((mod) => {
                const isSelected = selected[group.id]?.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() =>
                      toggleModifier(group.id, mod.id, group.max_selections)
                    }
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                      isSelected
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-800"
                    }`}
                  >
                    <span>{mod.name}</span>
                    {mod.price_delta !== 0 && (
                      <span className={isSelected ? "text-neutral-300" : "text-neutral-500"}>
                        {mod.price_delta > 0 ? "+" : ""}Gs.{" "}
                        {mod.price_delta.toLocaleString("es-PY")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Note */}
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

      {/* Bottom bar */}
      <div className="border-t border-neutral-100 bg-white px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Qty */}
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-neutral-600"
            >
              <Minus size={16} />
            </button>
            <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="text-neutral-600"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={!canAdd()}
            className="flex flex-1 items-center justify-between rounded-2xl bg-neutral-900 px-5 py-3 font-medium text-white disabled:opacity-40"
          >
            <span>Agregar al pedido</span>
            <span>Gs. {total.toLocaleString("es-PY")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
