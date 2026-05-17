"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Download, Trash2, QrCode, Pencil, X } from "lucide-react";
import { Switch, Button } from "@heroui/react";
import QRCode from "qrcode";
import { saveAs } from "file-saver";
import {
  createTables,
  deleteTable,
  toggleTableActive,
  updateTable,
} from "@/lib/actions/tables";
import type { Table } from "@/lib/types";

type ZoneOption = { id: string; name: string };

export default function TablesManager({
  tables: initial,
  restaurantSlug,
  branchSlug,
  branchId,
  zones,
  mode,
}: {
  tables: Table[];
  restaurantSlug: string;
  branchSlug?: string;
  branchId: string;
  zones: ZoneOption[];
  mode: "table" | "foodcourt";
}) {
  const [count, setCount] = useState(1);
  const [capacity, setCapacity] = useState(4);
  const [zoneId, setZoneId] = useState<string>("");
  const [editing, setEditing] = useState<Table | null>(null);
  const [isPending, startTransition] = useTransition();

  const branchPath = branchSlug ? `/${branchSlug}` : "";
  function getQrUrl(table: Table) {
    return `${window.location.origin}/${restaurantSlug}${branchPath}?table=${table.id}`;
  }
  function getFoodcourtQrUrl() {
    return `${window.location.origin}/${restaurantSlug}${branchPath}`;
  }

  async function downloadQR(url: string, filename: string) {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: { dark: "#171717", light: "#ffffff" },
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    saveAs(blob, `${filename}.png`);
  }

  async function downloadAllQRs() {
    for (const table of initial) {
      await downloadQR(getQrUrl(table), `mesa-${table.number}`);
    }
  }

  function handleAddTables() {
    if (count < 1) return;
    startTransition(async () => {
      await createTables(count, branchId, zoneId || null, capacity);
      setCount(1);
    });
  }

  if (mode === "foodcourt") {
    const foodcourtUrl =
      typeof window !== "undefined" ? getFoodcourtQrUrl() : "";

    return (
      <div className="p-8">
        <div className="max-w-sm">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center">
            <QrCode size={48} className="mx-auto mb-4 text-neutral-400" />
            <h2 className="text-base font-semibold">QR del local</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Modo food court — un solo QR para todos los clientes
            </p>
            <p className="mt-2 break-all text-xs text-neutral-400">
              {foodcourtUrl}
            </p>
            <Button
              variant="primary"
              fullWidth
              className="mt-4"
              onPress={() => downloadQR(foodcourtUrl, `qr-${restaurantSlug}`)}
            >
              <Download size={14} /> Descargar QR
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    "rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400";

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Cantidad
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className={`${inputClass} w-20`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Capacidad
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
            className={`${inputClass} w-20`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Zona
          </label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className={`${inputClass} min-w-[160px]`}
          >
            <option value="">Sin zona</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="primary"
          onPress={handleAddTables}
          isDisabled={isPending}
        >
          <Plus size={14} />
          {count === 1 ? "Agregar mesa" : `Agregar ${count} mesas`}
        </Button>
        {initial.length > 0 && (
          <Button variant="outline" onPress={downloadAllQRs}>
            <Download size={14} /> Descargar todos los QRs
          </Button>
        )}
      </div>

      {initial.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200">
          <p className="text-sm text-neutral-400">
            Sin mesas aún. Agregá la cantidad que tenés.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {initial.map((table) => (
            <QRCard
              key={table.id}
              table={table}
              zoneName={
                zones.find((z) => z.id === table.zone_id)?.name ?? null
              }
              url={typeof window !== "undefined" ? getQrUrl(table) : ""}
              onDownload={() =>
                downloadQR(
                  typeof window !== "undefined" ? getQrUrl(table) : "",
                  `mesa-${table.number}`
                )
              }
              onDelete={() =>
                startTransition(async () => {
                  if (!confirm(`¿Eliminar ${table.label}?`)) return;
                  await deleteTable(table.id);
                })
              }
              onToggle={() =>
                startTransition(async () => {
                  await toggleTableActive(table.id, !table.active);
                })
              }
              onEdit={() => setEditing(table)}
            />
          ))}
        </div>
      )}

      {editing && (
        <TableEditModal
          table={editing}
          zones={zones}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function QRCard({
  table,
  zoneName,
  url,
  onDownload,
  onDelete,
  onToggle,
  onEdit,
}: {
  table: Table;
  zoneName: string | null;
  url: string;
  onDownload: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 200, margin: 1 }).then(setQrDataUrl);
  }, [url]);

  return (
    <div
      className={`rounded-xl border bg-white p-4 text-center ${
        table.active ? "border-neutral-200" : "border-neutral-100 opacity-60"
      }`}
    >
      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt={table.label} className="mx-auto w-full" />
      ) : (
        <div className="flex h-[120px] items-center justify-center">
          <QrCode size={40} className="text-neutral-200" />
        </div>
      )}
      <p className="mt-2 text-sm font-semibold">{table.label}</p>
      <p className="text-xs text-neutral-500">
        {zoneName ? `${zoneName} · ` : ""}
        {table.capacity ?? 4} pers.
      </p>
      <div className="mt-2 flex items-center justify-center gap-1">
        <Switch
          isSelected={table.active}
          onChange={() => onToggle()}
          size="sm"
          aria-label={table.active ? "Mesa activa" : "Mesa inactiva"}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={onEdit}
          aria-label="Editar"
        >
          <Pencil size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          onPress={onDownload}
          aria-label="Descargar QR"
        >
          <Download size={14} />
        </Button>
        <Button
          variant="danger-soft"
          size="sm"
          isIconOnly
          onPress={onDelete}
          aria-label="Eliminar"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

function TableEditModal({
  table,
  zones,
  onClose,
}: {
  table: Table;
  zones: ZoneOption[];
  onClose: () => void;
}) {
  const [label, setLabel] = useState(table.label);
  const [capacity, setCapacity] = useState(table.capacity ?? 4);
  const [zoneId, setZoneId] = useState(table.zone_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateTable(table.id, {
          label: label.trim() || `Mesa ${table.number}`,
          capacity,
          zone_id: zoneId || null,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">Editar {table.label}</h2>
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
              Etiqueta
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Capacidad
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Zona
            </label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sin zona</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
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
            <Button type="submit" variant="primary" isDisabled={isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
