"use client";

import { useState, useTransition } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  createModifierGroup,
  deleteModifierGroup,
  createModifier,
  deleteModifier,
} from "@/lib/actions/menu";
import type { Product, ModifierGroup, Modifier } from "@/lib/types";

type ProductWithModifiers = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};

export default function ModifierModal({
  product,
  onClose,
}: {
  product: ProductWithModifiers;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupMax, setNewGroupMax] = useState(1);
  const [addingModifier, setAddingModifier] = useState<string | null>(null);
  const [newModifierName, setNewModifierName] = useState("");
  const [newModifierDelta, setNewModifierDelta] = useState(0);

  function handleAddGroup() {
    if (!newGroupName.trim()) return;
    startTransition(async () => {
      await createModifierGroup(product.id, {
        name: newGroupName.trim(),
        required: newGroupRequired,
        max_selections: newGroupMax,
      });
      setNewGroupName("");
    });
  }

  function handleAddModifier(groupId: string) {
    if (!newModifierName.trim()) return;
    startTransition(async () => {
      await createModifier(groupId, {
        name: newModifierName.trim(),
        price_delta: newModifierDelta,
      });
      setNewModifierName("");
      setNewModifierDelta(0);
      setAddingModifier(null);
    });
  }

  const inputClass =
    "rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[modal-backdrop_0.18s_ease-out]">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">Modificadores</h3>
            <p className="text-xs text-neutral-400">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
          {product.modifier_groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{group.name}</p>
                  <p className="text-xs text-neutral-400">
                    {group.required ? "Requerido" : "Opcional"} · máx.{" "}
                    {group.max_selections}
                  </p>
                </div>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      if (!confirm("¿Eliminar grupo?")) return;
                      await deleteModifierGroup(group.id);
                    })
                  }
                  className="text-neutral-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {group.modifiers?.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5"
                  >
                    <span className="text-sm">{mod.name}</span>
                    <div className="flex items-center gap-2">
                      {mod.price_delta !== 0 && (
                        <span className="text-xs text-neutral-500">
                          {mod.price_delta > 0 ? "+" : ""}
                          Gs. {mod.price_delta.toLocaleString("es-PY")}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          startTransition(async () => {
                            await deleteModifier(mod.id);
                          })
                        }
                        className="text-neutral-300 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {addingModifier === group.id ? (
                  <div className="flex gap-2 pt-1">
                    <input
                      autoFocus
                      placeholder="Nombre (ej: Sin cebolla)"
                      value={newModifierName}
                      onChange={(e) => setNewModifierName(e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="number"
                      placeholder="± Gs."
                      value={newModifierDelta}
                      onChange={(e) => setNewModifierDelta(parseFloat(e.target.value) || 0)}
                      className={`${inputClass} w-24`}
                    />
                    <button
                      onClick={() => handleAddModifier(group.id)}
                      disabled={isPending}
                      className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setAddingModifier(null)}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingModifier(group.id)}
                    className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 mt-1"
                  >
                    <Plus size={12} /> Agregar opción
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* New group form */}
          <div className="rounded-xl border border-dashed border-neutral-300 p-4">
            <p className="mb-3 text-xs font-medium text-neutral-500">
              Nuevo grupo de modificadores
            </p>
            <div className="space-y-2">
              <input
                placeholder="Ej: Extras, Sin ingrediente, Término..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className={`${inputClass} w-full`}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newGroupRequired}
                    onChange={(e) => setNewGroupRequired(e.target.checked)}
                  />
                  Requerido
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">Máx. selecciones:</span>
                  <input
                    type="number"
                    min={1}
                    value={newGroupMax}
                    onChange={(e) => setNewGroupMax(parseInt(e.target.value) || 1)}
                    className="w-16 rounded border border-neutral-200 px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleAddGroup}
                disabled={isPending || !newGroupName.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                <Plus size={14} /> Crear grupo
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 px-5 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
