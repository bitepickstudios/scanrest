"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Download,
  Trash2,
  QrCode,
  Pencil,
  X,
  Receipt,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";
import { Switch, Button, Chip, Tabs } from "@heroui/react";
import SelectField from "@/components/ui/SelectField";
import ZonesManager from "@/components/admin/ZonesManager";
import QRCode from "qrcode";
import { saveAs } from "file-saver";
import {
  createTables,
  deleteTable,
  toggleTableActive,
  updateTable,
} from "@/lib/actions/tables";
import { closeTableSession, markSessionBilling } from "@/lib/actions/table-sessions";
import { createClient } from "@/lib/supabase/client";
import type { Table } from "@/lib/types";

type ZoneOption = { id: string; name: string; sort_order?: number };

type SessionOrderItem = {
  id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  order_item_modifiers: { price_delta: number }[];
};

type SessionOrder = {
  id: string;
  order_number?: number;
  status?: string;
  customer_name?: string | null;
  created_at?: string;
  order_items: SessionOrderItem[];
};

type OpenSession = {
  id: string;
  status: "open" | "billing";
  opened_at: string;
  closed_at: string | null;
  customer_name: string | null;
  table_id: string;
  orders: SessionOrder[];
};

type ClosedSession = {
  id: string;
  status: "closed";
  opened_at: string;
  closed_at: string;
  customer_name: string | null;
  table_id: string;
  tables: { number: number; label: string | null } | null;
  orders: SessionOrder[];
};

function orderTotal(o: SessionOrder) {
  return o.order_items.reduce((sum, it) => {
    const mods = (it.order_item_modifiers ?? []).reduce((s, m) => s + m.price_delta, 0);
    return sum + (it.unit_price + mods) * it.quantity;
  }, 0);
}

function sessionTotal(s: { orders: SessionOrder[] }) {
  return s.orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + orderTotal(o), 0);
}

function sessionItemCount(s: { orders: SessionOrder[] }) {
  return s.orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.order_items.reduce((s2, it) => s2 + it.quantity, 0), 0);
}

function formatDuration(ms: number) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
}

export default function TablesManager({
  tables: initial,
  restaurantSlug,
  branchSlug,
  branchId,
  restaurantId,
  zones,
  mode,
  openSessions,
  closedSessions,
}: {
  tables: Table[];
  restaurantSlug: string;
  branchSlug?: string;
  branchId: string;
  restaurantId: string;
  zones: ZoneOption[];
  mode: "table" | "foodcourt";
  openSessions: OpenSession[];
  closedSessions: ClosedSession[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Table | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Table | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tables-page-${restaurantId}-${branchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_sessions" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { branch_id?: string };
          if (row?.branch_id !== branchId) return;
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tables" },
        () => router.refresh()
      )
      .subscribe();
    const interval = setInterval(() => router.refresh(), 10000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, branchId, router]);

  const sessionByTable = useMemo(() => {
    const map = new Map<string, OpenSession>();
    for (const s of openSessions) map.set(s.table_id, s);
    return map;
  }, [openSessions]);

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
    const foodcourtUrl = typeof window !== "undefined" ? getFoodcourtQrUrl() : "";
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
      <Tabs defaultSelectedKey="tables">
        <Tabs.ListContainer className="w-fit">
          <Tabs.List
            aria-label="Vistas"
            className="w-fit *:h-7 *:w-fit *:px-3 *:text-sm *:font-medium"
          >
            <Tabs.Tab id="tables">
              Mesas
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="sessions">
              Sesiones
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="zones">
              Zonas
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="tables" className="pt-6">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Button variant="primary" onPress={() => setCreating(true)} isDisabled={isPending}>
              <Plus size={14} /> Agregar mesas
            </Button>
            {initial.length > 0 && (
              <Button variant="outline" onPress={downloadAllQRs}>
                <Download size={14} /> Descargar QRs
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {initial.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  zoneName={zones.find((z) => z.id === table.zone_id)?.name ?? null}
                  session={sessionByTable.get(table.id) ?? null}
                  url={typeof window !== "undefined" ? getQrUrl(table) : ""}
                  restaurantSlug={restaurantSlug}
                  branchSlug={branchSlug ?? ""}
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
        </Tabs.Panel>

        <Tabs.Panel id="sessions" className="pt-6">
          <SessionsHistory sessions={closedSessions} />
        </Tabs.Panel>

        <Tabs.Panel id="zones" className="pt-6">
          <ZonesManager
            branchId={branchId}
            zones={zones.map((z) => ({
              id: z.id,
              name: z.name,
              sort_order: z.sort_order ?? 0,
            }))}
          />
        </Tabs.Panel>
      </Tabs>

      {editing && (
        <TableEditModal table={editing} zones={zones} onClose={() => setEditing(null)} />
      )}
      {creating && (
        <CreateTablesModal
          branchId={branchId}
          zones={zones}
          onClose={() => setCreating(false)}
        />
      )}
      {deleting && (
        <DeleteTableModal table={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}

function TableCard({
  table,
  zoneName,
  session,
  url,
  restaurantSlug,
  branchSlug,
  onDownload,
  onDelete,
  onToggle,
  onEdit,
}: {
  table: Table;
  zoneName: string | null;
  session: OpenSession | null;
  url: string;
  restaurantSlug: string;
  branchSlug: string;
  onDownload: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const occupied = !!session;
  const billing = session?.status === "billing";

  const total = session ? sessionTotal(session) : 0;
  const itemCount = session ? sessionItemCount(session) : 0;
  const orderCount = session
    ? session.orders.filter((o) => o.status !== "cancelled").length
    : 0;
  const openedAt = session ? new Date(session.opened_at) : null;

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 transition-colors ${
        billing
          ? "border-amber-300 ring-1 ring-amber-200"
          : occupied
          ? "border-emerald-300 ring-1 ring-emerald-200"
          : table.active
          ? "border-neutral-200"
          : "border-neutral-100 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-neutral-900">
            {table.label}
          </p>
          <p className="text-xs text-neutral-500">
            {zoneName ? `${zoneName} · ` : ""}
            <Users size={11} className="inline -mt-0.5" /> {table.capacity ?? 4}
          </p>
        </div>
        {occupied ? (
          billing ? (
            <Chip color="warning" variant="soft" size="sm">
              <Chip.Label>Facturando</Chip.Label>
            </Chip>
          ) : (
            <Chip color="success" variant="soft" size="sm">
              <Chip.Label>Ocupada</Chip.Label>
            </Chip>
          )
        ) : (
          <Chip color="default" variant="soft" size="sm">
            <Chip.Label>Disponible</Chip.Label>
          </Chip>
        )}
      </div>

      <div className="mt-3 min-h-[140px] flex-1">
        {session ? (
          <div className="flex h-full flex-col gap-2">
            <div className="rounded-xl bg-neutral-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                Cliente
              </p>
              <p className="truncate text-sm font-semibold text-neutral-800">
                {session.customer_name ?? "—"}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
                <Clock size={11} /> Abrió{" "}
                {openedAt?.toLocaleTimeString("es-PY", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {openedAt ? formatDuration(Date.now() - openedAt.getTime()) : ""}
              </p>
            </div>
            <div className="space-y-1">
              {session.orders
                .filter((o) => o.status !== "cancelled")
                .slice(0, 3)
                .map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 px-2.5 py-1.5 text-xs"
                  >
                    <span className="truncate text-neutral-700">
                      #{o.order_number} ·{" "}
                      {o.order_items.reduce((s, it) => s + it.quantity, 0)} items
                    </span>
                    <span className="tabular-nums font-medium">
                      Gs. {orderTotal(o).toLocaleString("es-PY")}
                    </span>
                  </div>
                ))}
              {orderCount > 3 && (
                <p className="text-[11px] text-neutral-400">
                  +{orderCount - 3} pedidos más
                </p>
              )}
            </div>
            <div className="mt-auto flex items-end justify-between border-t border-neutral-100 pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                  Total mesa
                </p>
                <p className="text-base font-bold tabular-nums">
                  Gs. {total.toLocaleString("es-PY")}
                </p>
                <p className="text-[11px] text-neutral-500">
                  {orderCount} pedidos · {itemCount} items
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl bg-neutral-50 px-3 py-4 text-center">
            <QrCode size={28} className="text-neutral-300" />
            <p className="mt-2 text-xs text-neutral-400">
              Esperando primer pedido vía QR
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3">
        {session ? (
          <>
            {!billing && (
              <Button
                size="sm"
                variant="outline"
                onPress={() =>
                  startTransition(async () => {
                    await markSessionBilling(session.id, restaurantSlug, branchSlug);
                  })
                }
                isDisabled={isPending}
              >
                <Receipt size={14} /> Pedir cuenta
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              onPress={() =>
                startTransition(async () => {
                  await closeTableSession(session.id, restaurantSlug, branchSlug);
                })
              }
              isDisabled={isPending}
            >
              <CheckCircle2 size={14} /> Liberar mesa
            </Button>
            <div className="ml-auto flex items-center gap-1">
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
            </div>
          </>
        ) : (
          <>
            <Switch
              isSelected={table.active}
              onChange={onToggle}
              size="sm"
              aria-label={table.active ? "Mesa activa" : "Mesa inactiva"}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            <div className="ml-auto flex items-center gap-1">
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
          </>
        )}
      </div>
    </div>
  );
}

function SessionsHistory({ sessions }: { sessions: ClosedSession[] }) {
  const metrics = useMemo(() => {
    if (sessions.length === 0) {
      return { avgDuration: 0, avgTicket: 0, avgItems: 0, count: 0, totalRevenue: 0 };
    }
    let totalMs = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    for (const s of sessions) {
      const opened = new Date(s.opened_at).getTime();
      const closed = new Date(s.closed_at).getTime();
      totalMs += closed - opened;
      totalRevenue += sessionTotal(s);
      totalItems += sessionItemCount(s);
    }
    return {
      avgDuration: totalMs / sessions.length,
      avgTicket: totalRevenue / sessions.length,
      avgItems: totalItems / sessions.length,
      count: sessions.length,
      totalRevenue,
    };
  }, [sessions]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Sesiones (30d)" value={`${metrics.count}`} />
        <MetricCard
          label="Duración promedio"
          value={metrics.count ? formatDuration(metrics.avgDuration) : "—"}
        />
        <MetricCard
          label="Ticket promedio"
          value={
            metrics.count
              ? `Gs. ${Math.round(metrics.avgTicket).toLocaleString("es-PY")}`
              : "—"
          }
        />
        <MetricCard
          label="Items promedio"
          value={metrics.count ? metrics.avgItems.toFixed(1) : "—"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-2.5 text-left">Mesa</th>
              <th className="px-4 py-2.5 text-left">Cliente</th>
              <th className="px-4 py-2.5 text-left">Inicio</th>
              <th className="px-4 py-2.5 text-left">Fin</th>
              <th className="px-4 py-2.5 text-left">Duración</th>
              <th className="px-4 py-2.5 text-right">Pedidos</th>
              <th className="px-4 py-2.5 text-right">Items</th>
              <th className="px-4 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sessions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-neutral-400">
                  Sin sesiones cerradas todavía.
                </td>
              </tr>
            )}
            {sessions.map((s) => {
              const opened = new Date(s.opened_at);
              const closed = new Date(s.closed_at);
              return (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2.5 font-medium">
                    {s.tables?.label ?? (s.tables ? `Mesa ${s.tables.number}` : "—")}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {s.customer_name ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {opened.toLocaleString("es-PY", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600">
                    {closed.toLocaleString("es-PY", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-700">
                    {formatDuration(closed.getTime() - opened.getTime())}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {s.orders.length}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {sessionItemCount(s)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    Gs. {sessionTotal(s).toLocaleString("es-PY")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

function DeleteTableModal({ table, onClose }: { table: Table; onClose: () => void }) {
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
            ¿Seguro que querés eliminar{" "}
            <span className="font-semibold">{table.label}</span>? Esta acción no se puede
            deshacer.
          </p>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
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
              Se numerarán: {labelPrefix.trim() || "Mesa"} 1, {labelPrefix.trim() || "Mesa"}{" "}
              2, …
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
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
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
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
