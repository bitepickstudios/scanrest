"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Download, Trash2, ToggleLeft, ToggleRight, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { saveAs } from "file-saver";
import { createTables, deleteTable, toggleTableActive } from "@/lib/actions/tables";
import type { Table } from "@/lib/types";

export default function TablesManager({
  tables: initial,
  restaurantSlug,
  mode,
}: {
  tables: Table[];
  restaurantSlug: string;
  mode: "table" | "foodcourt";
}) {
  const [count, setCount] = useState(1);
  const [isPending, startTransition] = useTransition();
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "") ?? "";

  function getQrUrl(table: Table) {
    return `${window.location.origin}/${restaurantSlug}?table=${table.id}`;
  }

  function getFoodcourtQrUrl() {
    return `${window.location.origin}/${restaurantSlug}`;
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
      await createTables(count);
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
            <p className="mt-2 break-all text-xs text-neutral-400">{foodcourtUrl}</p>
            <button
              onClick={() => downloadQR(foodcourtUrl, `qr-${restaurantSlug}`)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              <Download size={14} /> Descargar QR
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-20 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />
          <button
            onClick={handleAddTables}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            <Plus size={14} />
            {count === 1 ? "Agregar mesa" : `Agregar ${count} mesas`}
          </button>
        </div>
        {initial.length > 0 && (
          <button
            onClick={downloadAllQRs}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            <Download size={14} /> Descargar todos los QRs
          </button>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QRCard({
  table,
  url,
  onDownload,
  onDelete,
  onToggle,
}: {
  table: Table;
  url: string;
  onDownload: () => void;
  onDelete: () => void;
  onToggle: () => void;
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
        <img src={qrDataUrl} alt={table.label} className="mx-auto w-full" />
      ) : (
        <div className="flex h-[120px] items-center justify-center">
          <QrCode size={40} className="text-neutral-200" />
        </div>
      )}
      <p className="mt-2 text-sm font-semibold">{table.label}</p>
      <div className="mt-2 flex items-center justify-center gap-1">
        <button
          onClick={onToggle}
          className={`rounded p-1 ${table.active ? "text-green-500" : "text-neutral-300"}`}
          title={table.active ? "Activa" : "Inactiva"}
        >
          {table.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        </button>
        <button
          onClick={onDownload}
          className="rounded p-1 text-neutral-400 hover:text-neutral-700"
          title="Descargar QR"
        >
          <Download size={16} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1 text-neutral-300 hover:text-red-500"
          title="Eliminar"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
