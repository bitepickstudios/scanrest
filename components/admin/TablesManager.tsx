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
  LayoutGrid,
  List,
  Power,
  PlayCircle,
  ShoppingBag,
  MoreHorizontal,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { Switch, Button, Chip, Tabs, Modal, SearchField, TextField, Input, Label } from "@heroui/react";
import { openTableSessionAsWaiter } from "@/lib/actions/table-sessions";
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
  party_size?: number | null;
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
  const [actionsFor, setActionsFor] = useState<Table | null>(null);
  const [tablesView, setTablesView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
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

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initial;
    return initial.filter((t) => {
      const label = (t.label ?? "").toLowerCase();
      const num = String(t.number ?? "");
      const zoneName = (
        zones.find((z) => z.id === t.zone_id)?.name ?? ""
      ).toLowerCase();
      const session = sessionByTable.get(t.id);
      const customer = (session?.customer_name ?? "").toLowerCase();
      return (
        label.includes(q) ||
        num.includes(q) ||
        zoneName.includes(q) ||
        customer.includes(q)
      );
    });
  }, [initial, search, zones, sessionByTable]);

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
            <div className="w-64">
              <SearchField
                value={search}
                onChange={setSearch}
                aria-label="Buscar mesas"
                fullWidth
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Buscar mesa, zona, cliente..." />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </div>
            <div className="ml-auto">
              <Tabs
                selectedKey={tablesView}
                onSelectionChange={(k) => setTablesView(k as "grid" | "list")}
              >
                <Tabs.ListContainer className="w-fit">
                  <Tabs.List
                    aria-label="Vista de mesas"
                    className="w-fit *:h-7 *:w-fit *:px-3 *:text-xs *:font-medium"
                  >
                    <Tabs.Tab id="grid">
                      <LayoutGrid size={12} />
                      <span className="ml-1">Grid</span>
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="list">
                      <List size={12} />
                      <span className="ml-1">Lista</span>
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
            </div>
          </div>

          {initial.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200">
              <p className="text-sm text-neutral-400">
                Sin mesas aún. Agregá la cantidad que tenés.
              </p>
            </div>
          ) : tablesView === "grid" ? (
            filteredTables.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-200">
                <p className="text-sm text-neutral-400">
                  Sin resultados para &quot;{search}&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    zoneName={zones.find((z) => z.id === table.zone_id)?.name ?? null}
                    session={sessionByTable.get(table.id) ?? null}
                    branchId={branchId}
                    restaurantSlug={restaurantSlug}
                    branchSlug={branchSlug ?? ""}
                    onOpen={() => setActionsFor(table)}
                  />
                ))}
              </div>
            )
          ) : (
            <TablesListView
              tables={filteredTables}
              zones={zones}
              sessionByTable={sessionByTable}
              onOpen={(t) => setActionsFor(t)}
            />
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
      {actionsFor && (
        <TableActionsModal
          table={actionsFor}
          session={sessionByTable.get(actionsFor.id) ?? null}
          zoneName={
            zones.find((z) => z.id === actionsFor.zone_id)?.name ?? null
          }
          restaurantSlug={restaurantSlug}
          branchSlug={branchSlug ?? ""}
          onClose={() => setActionsFor(null)}
          onEdit={() => {
            setEditing(actionsFor);
            setActionsFor(null);
          }}
          onDelete={() => {
            setDeleting(actionsFor);
            setActionsFor(null);
          }}
          onDownloadQR={() =>
            downloadQR(
              typeof window !== "undefined" ? getQrUrl(actionsFor) : "",
              `mesa-${actionsFor.number}`
            )
          }
        />
      )}
    </div>
  );
}

function TablesListView({
  tables,
  zones,
  sessionByTable,
  onOpen,
}: {
  tables: Table[];
  zones: ZoneOption[];
  sessionByTable: Map<string, OpenSession>;
  onOpen: (t: Table) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
          <tr>
            <th className="px-4 py-3">Mesa</th>
            <th className="px-4 py-3">Zona</th>
            <th className="px-4 py-3">Capacidad</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Sesión actual</th>
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {tables.map((t) => {
            const s = sessionByTable.get(t.id) ?? null;
            const total = s ? sessionTotal(s) : 0;
            const zoneName =
              zones.find((z) => z.id === t.zone_id)?.name ?? "—";
            return (
              <tr
                key={t.id}
                className="cursor-pointer hover:bg-neutral-50"
                onClick={() => onOpen(t)}
              >
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {t.label ?? `Mesa ${t.number}`}
                </td>
                <td className="px-4 py-3 text-neutral-700">{zoneName}</td>
                <td className="px-4 py-3 text-neutral-700 tabular-nums">
                  {t.capacity ?? 4}
                </td>
                <td className="px-4 py-3">
                  {s ? (
                    s.status === "billing" ? (
                      <Chip color="warning" variant="soft" size="sm">
                        <Chip.Label>Facturando</Chip.Label>
                      </Chip>
                    ) : (
                      <Chip color="success" variant="soft" size="sm">
                        <Chip.Label>Ocupada</Chip.Label>
                      </Chip>
                    )
                  ) : t.active ? (
                    <Chip color="default" variant="soft" size="sm">
                      <Chip.Label>Disponible</Chip.Label>
                    </Chip>
                  ) : (
                    <Chip color="default" variant="soft" size="sm">
                      <Chip.Label>Inactiva</Chip.Label>
                    </Chip>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {s ? s.customer_name ?? "—" : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {s ? `Gs. ${total.toLocaleString("es-PY")}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TableActionsModal({
  table,
  session,
  zoneName,
  restaurantSlug,
  branchSlug,
  onClose,
  onEdit,
  onDelete,
  onDownloadQR,
}: {
  table: Table;
  session: OpenSession | null;
  zoneName: string | null;
  restaurantSlug: string;
  branchSlug: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownloadQR: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const occupied = !!session;
  const billing = session?.status === "billing";

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              {table.label ?? `Mesa ${table.number}`}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <div className="rounded-xl bg-neutral-50 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-neutral-700">
                {zoneName && (
                  <span>
                    Zona: <span className="font-medium">{zoneName}</span>
                  </span>
                )}
                <span>
                  Capacidad:{" "}
                  <span className="font-medium">{table.capacity ?? 4}</span>
                </span>
                <span className="ml-auto">
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
                  ) : table.active ? (
                    <Chip color="default" variant="soft" size="sm">
                      <Chip.Label>Disponible</Chip.Label>
                    </Chip>
                  ) : (
                    <Chip color="default" variant="soft" size="sm">
                      <Chip.Label>Inactiva</Chip.Label>
                    </Chip>
                  )}
                </span>
              </div>
              {session && (
                <p className="mt-2 text-xs text-neutral-500">
                  Cliente:{" "}
                  <span className="font-medium text-neutral-700">
                    {session.customer_name ?? "—"}
                  </span>{" "}
                  · Total{" "}
                  <span className="font-medium text-neutral-700 tabular-nums">
                    Gs. {sessionTotal(session).toLocaleString("es-PY")}
                  </span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {session && !billing && (
                <Button
                  variant="outline"
                  onPress={() =>
                    startTransition(async () => {
                      await markSessionBilling(
                        session.id,
                        restaurantSlug,
                        branchSlug
                      );
                      onClose();
                    })
                  }
                  isDisabled={isPending}
                  className="justify-center gap-1.5"
                >
                  <Receipt size={14} /> Marcar para cobrar
                </Button>
              )}
              {session && (
                <Button
                  variant="primary"
                  onPress={() =>
                    startTransition(async () => {
                      await closeTableSession(
                        session.id,
                        restaurantSlug,
                        branchSlug
                      );
                      onClose();
                    })
                  }
                  isDisabled={isPending}
                  className="justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Liberar mesa
                </Button>
              )}
              <Button
                variant="outline"
                onPress={() =>
                  startTransition(async () => {
                    await toggleTableActive(table.id, !table.active);
                  })
                }
                isDisabled={isPending || occupied}
                className="justify-center gap-1.5"
              >
                <Power size={14} />
                {table.active ? "Deshabilitar" : "Habilitar"}
              </Button>
              <Button
                variant="outline"
                onPress={onEdit}
                className="justify-center gap-1.5"
              >
                <Pencil size={14} /> Editar datos
              </Button>
              <Button
                variant="outline"
                onPress={onDownloadQR}
                className="justify-center gap-1.5"
              >
                <Download size={14} /> Descargar QR
              </Button>
              <Button
                variant="danger-soft"
                onPress={onDelete}
                isDisabled={occupied}
                className="justify-center gap-1.5"
              >
                <Trash2 size={14} /> Eliminar
              </Button>
            </div>
            {occupied && (
              <p className="text-xs text-neutral-500">
                Algunas acciones quedan deshabilitadas mientras la mesa está
                ocupada.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={onClose}>
              Cerrar
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function TableCard({
  table,
  zoneName,
  session,
  onOpen,
  branchId,
  restaurantSlug,
  branchSlug,
}: {
  table: Table;
  zoneName: string | null;
  session: OpenSession | null;
  onOpen: () => void;
  branchId: string;
  restaurantSlug: string;
  branchSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [quickOpen, setQuickOpen] = useState(false);
  const occupied = !!session;
  const billing = session?.status === "billing";

  const total = session ? sessionTotal(session) : 0;
  const itemCount = session ? sessionItemCount(session) : 0;
  const orderCount = session
    ? session.orders.filter((o) => o.status !== "cancelled").length
    : 0;
  const openedAt = session ? new Date(session.opened_at) : null;

  const orderHref = `/staff/${restaurantSlug}/${branchSlug}/order/new?table=${table.id}`;

  // Status accent — thin top bar, no heavy rings
  const accent = billing
    ? "before:bg-amber-400"
    : occupied
    ? "before:bg-emerald-500"
    : table.active
    ? "before:bg-neutral-300"
    : "before:bg-neutral-200";

  const cardCls = `group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md before:absolute before:inset-x-0 before:top-0 before:h-1 ${accent} ${
    table.active ? "border-neutral-200" : "border-neutral-100 opacity-70"
  }`;

  function stop(e: React.MouseEvent | React.PointerEvent) {
    e.stopPropagation();
  }

  return (
    <>
      <div className={cardCls}>
        {/* Header: clickable opens actions modal */}
        <button
          type="button"
          onClick={onOpen}
          className="flex items-start justify-between gap-2 p-4 pb-3 text-left"
        >
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-heading)] text-xl tracking-tight text-neutral-900">
              {table.label ?? `Mesa ${table.number}`}
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
              {zoneName && <span>{zoneName}</span>}
              {zoneName && <span className="text-neutral-300">·</span>}
              <span className="inline-flex items-center gap-1">
                <Users size={11} />
                {(session?.party_size as number | undefined) ?? table.capacity ?? 4}
              </span>
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
          ) : table.active ? (
            <Chip color="default" variant="soft" size="sm">
              <Chip.Label>Disponible</Chip.Label>
            </Chip>
          ) : (
            <Chip color="default" variant="soft" size="sm">
              <Chip.Label>Deshabilitada</Chip.Label>
            </Chip>
          )}
        </button>

        {/* Body */}
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 px-4 text-left"
        >
          {session ? (
            <div className="space-y-2.5">
              <div>
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
              <div className="flex items-end justify-between border-t border-neutral-100 pt-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                    Total
                  </p>
                  <p className="text-lg font-bold tabular-nums text-neutral-900">
                    Gs. {total.toLocaleString("es-PY")}
                  </p>
                </div>
                <p className="text-[11px] text-neutral-500">
                  {orderCount} pedido{orderCount === 1 ? "" : "s"} · {itemCount}{" "}
                  items
                </p>
              </div>
            </div>
          ) : table.active ? (
            <div className="flex min-h-[110px] flex-col items-center justify-center rounded-xl bg-neutral-50 px-3 py-4 text-center">
              <QrCode size={24} className="text-neutral-300" />
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Lista para recibir clientes
              </p>
            </div>
          ) : (
            <div className="flex min-h-[110px] flex-col items-center justify-center rounded-xl bg-neutral-50 px-3 py-4 text-center">
              <Power size={22} className="text-neutral-300" />
              <p className="mt-1.5 text-[11px] text-neutral-400">
                Mesa deshabilitada
              </p>
            </div>
          )}
        </button>

        {/* Quick actions footer — varies by state */}
        <div
          className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 p-3"
          onPointerDown={stop}
          onClick={stop}
        >
          {!table.active && (
            <Button
              size="sm"
              variant="primary"
              fullWidth
              isDisabled={isPending}
              onPress={() =>
                startTransition(async () => {
                  await toggleTableActive(table.id, true);
                })
              }
              className="justify-center gap-1.5"
            >
              <Power size={13} /> Habilitar mesa
            </Button>
          )}

          {table.active && !session && (
            <>
              <Button
                size="sm"
                variant="primary"
                fullWidth
                onPress={() => setQuickOpen(true)}
                className="justify-center gap-1.5"
              >
                <PlayCircle size={13} /> Habilitar para cliente
              </Button>
            </>
          )}

          {session && !billing && (
            <>
              <Link href={orderHref} className="flex-1">
                <Button
                  size="sm"
                  variant="primary"
                  fullWidth
                  className="justify-center gap-1.5"
                >
                  <ShoppingBag size={13} /> Cargar pedido
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                isIconOnly
                aria-label="Más acciones"
                onPress={onOpen}
              >
                <MoreHorizontal size={14} />
              </Button>
            </>
          )}

          {session && billing && (
            <>
              <Button
                size="sm"
                variant="primary"
                fullWidth
                className="justify-center gap-1.5"
                onPress={onOpen}
              >
                <CheckCircle2 size={13} /> Liberar / Cobrar
              </Button>
            </>
          )}
        </div>
      </div>

      {quickOpen && (
        <QuickEnableModal
          table={table}
          branchId={branchId}
          onClose={() => setQuickOpen(false)}
        />
      )}
    </>
  );
}

function QuickEnableModal({
  table,
  branchId,
  onClose,
}: {
  table: Table;
  branchId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [partySize, setPartySize] = useState<number>(table.capacity ?? 2);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await openTableSessionAsWaiter({
          branchId,
          tableId: table.id,
          customerName: customerName.trim() || "Walk-in",
          partySize,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al habilitar");
      }
    });
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-sm">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>
              Habilitar {table.label ?? `Mesa ${table.number}`}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">
                ¿Cuántas personas?
              </p>
              <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  isDisabled={partySize <= 1}
                  onPress={() => setPartySize((n) => Math.max(1, n - 1))}
                  aria-label="Menos"
                >
                  <Minus size={14} />
                </Button>
                <span className="flex-1 text-center text-3xl font-bold tabular-nums text-neutral-900">
                  {partySize}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  isIconOnly
                  isDisabled={partySize >= 99}
                  onPress={() => setPartySize((n) => Math.min(99, n + 1))}
                  aria-label="Más"
                >
                  <Plus size={14} />
                </Button>
              </div>
              {table.capacity && (
                <p className="mt-1 text-[11px] text-neutral-400">
                  Capacidad sugerida: {table.capacity}
                </p>
              )}
            </div>
            <TextField
              value={customerName}
              onChange={setCustomerName}
              className="w-full"
            >
              <Label>Nombre del cliente (opcional)</Label>
              <Input placeholder="Walk-in" />
            </TextField>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" type="button" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onPress={submit}
              isDisabled={isPending}
              className="gap-1.5"
            >
              <PlayCircle size={14} /> Habilitar y abrir
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
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
