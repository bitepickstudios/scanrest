"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Download, Trash2, QrCode, Pencil, X } from "lucide-react";
import { Switch, Button } from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
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
  const [editing, setEditing] = useState<Table | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Table | null>(null);
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

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          onPress={() => setCreating(true)}
          isDisabled={isPending}
        >
          <Plus size={14} /> Agregar mesas
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
              onDelete={() => setDeleting(table)}
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

      {creating && (
        <CreateTablesModal
          branchId={branchId}
          zones={zones}
          onClose={() => setCreating(false)}
        />
      )}

      {deleting && (
        <DeleteTableModal
          table={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function DeleteTableModal({
  table,
  onClose,
}: {
  table: Table;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteTable(table.id);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">Eliminar mesa</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-neutral-700">
            ¿Seguro que querés eliminar <span className="font-semibold">{table.label}</span>?
            Esta acción no se puede deshacer.
          </p>
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
              type="button"
              variant="danger-soft"
              onPress={handleDelete}
              isDisabled={isPending}
            >
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTablesModal({
  branchId,
  zones,
  onClose,
}: {
  branchId: string;
  zones: ZoneOption[];
  onClose: () => void;
}) {
  const [count, setCount] = useState(1);
  const [capacity, setCapacity] = useState(4);
  const [zoneId, setZoneId] = useState("");
  const [labelPrefix, setLabelPrefix] = useState("Mesa");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (count < 1) {
      setError("Cantidad debe ser al menos 1.");
      return;
    }
    startTransition(async () => {
      try {
        await createTables(count, branchId, zoneId || null, capacity, labelPrefix);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear mesas");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">Agregar mesas</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
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
                onChange={(e) => setCapacity(parseInt(e.target.value) || 4)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">
              Prefijo etiqueta
            </label>
            <input
              value={labelPrefix}
              onChange={(e) => setLabelPrefix(e.target.value)}
              placeholder="Mesa"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Se numerarán: {labelPrefix.trim() || "Mesa"} 1, {labelPrefix.trim() || "Mesa"} 2, …
            </p>
          </div>
          <SelectField
            label="Zona"
            value={zoneId}
            onChange={setZoneId}
            options={zones.map((z) => ({ value: z.id, label: z.name }))}
            emptyLabel="Sin zona"
            placeholder="Seleccionar zona"
          />
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
              {count === 1 ? "Crear mesa" : `Crear ${count} mesas`}
            </Button>
          </div>
        </form>
      </div>
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
          <SelectField
            label="Zona"
            value={zoneId}
            onChange={setZoneId}
            options={zones.map((z) => ({ value: z.id, label: z.name }))}
            emptyLabel="Sin zona"
            placeholder="Seleccionar zona"
          />
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
