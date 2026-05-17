"use client";

import { useState, useTransition } from "react";
import { Plus, LayoutGrid, Pencil, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@heroui/react";
import {
  createZone,
  updateZone,
  deleteZone,
  reorderZones,
} from "@/lib/actions/zones";
import type { Zone } from "@/lib/database.types";

type ZoneRow = Pick<Zone, "id" | "name" | "sort_order">;

export default function ZonesManager({
  branchId,
  zones: initial,
}: {
  branchId: string;
  zones: ZoneRow[];
}) {
  const [editing, setEditing] = useState<ZoneRow | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(z: ZoneRow) {
    if (!confirm(`¿Eliminar zona "${z.name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteZone(z.id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleMove(index: number, dir: -1 | 1) {
    const next = [...initial];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    startTransition(async () => {
      try {
        await reorderZones(
          branchId,
          next.map((z) => z.id)
        );
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-2">
      {initial.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center">
          <LayoutGrid size={28} className="mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-500">
            Sin zonas todavía. Creá Salón, Terraza, Barra, etc. para organizar mesas.
          </p>
        </div>
      )}

      {initial.map((z, i) => (
        <div
          key={z.id}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <LayoutGrid size={15} />
          </div>
          <p className="flex-1 truncate text-sm font-semibold text-neutral-900">
            {z.name}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              isDisabled={i === 0 || isPending}
              onPress={() => handleMove(i, -1)}
              aria-label="Subir"
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              isDisabled={i === initial.length - 1 || isPending}
              onPress={() => handleMove(i, 1)}
              aria-label="Bajar"
            >
              <ArrowDown size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={() => setEditing(z)}
              aria-label="Editar"
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              isIconOnly
              onPress={() => handleDelete(z)}
              isDisabled={isPending}
              aria-label="Eliminar"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className="block w-full rounded-xl border border-dashed border-neutral-300 bg-white p-3 text-left transition-all hover:border-neutral-400"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
            <Plus size={15} />
          </div>
          <p className="text-sm font-semibold text-neutral-900">Crear zona</p>
        </div>
      </button>

      {editing && (
        <ZoneModal
          branchId={branchId}
          zone={editing === "new" ? null : editing}
          nextSortOrder={initial.length}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function ZoneModal({
  branchId,
  zone,
  nextSortOrder,
  onClose,
}: {
  branchId: string;
  zone: ZoneRow | null;
  nextSortOrder: number;
  onClose: () => void;
}) {
  const [name, setName] = useState(zone?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (zone) {
          await updateZone(zone.id, { name: name.trim() });
        } else {
          await createZone(branchId, { name: name.trim(), sortOrder: nextSortOrder });
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">
            {zone ? "Editar zona" : "Nueva zona"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Nombre *
            </label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
              placeholder="Salón, Terraza, Barra..."
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={isPending || !name.trim()}
            >
              {zone ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
