"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Plus, Users, Clock, Receipt } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import type { Table } from "@/lib/types";

type Zone = { id: string; name: string };
type Order = {
  table_id: string | null;
  status: "new" | "preparing" | "ready" | "delivered";
};
type Session = {
  id: string;
  table_id: string | null;
  customer_name: string | null;
  party_size: number | null;
  opened_at: string;
  bill_requested_at: string | null;
  status: string;
};

function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

function formatMinutes(min: number): string {
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function TableGrid({
  restaurantSlug,
  branchSlug,
  tables,
  zones,
  activeOrders,
  sessions,
}: {
  restaurantSlug: string;
  branchSlug: string;
  tables: Table[];
  zones: Zone[];
  activeOrders: Order[];
  sessions: Session[];
}) {
  const occupiedTableIds = useMemo(
    () =>
      new Set(
        activeOrders
          .filter((o) => o.table_id && o.status !== "delivered")
          .map((o) => o.table_id as string)
      ),
    [activeOrders]
  );

  const sessionByTable = useMemo(() => {
    const map = new Map<string, Session>();
    for (const s of sessions) {
      if (s.table_id) map.set(s.table_id, s);
    }
    return map;
  }, [sessions]);

  function tableHref(t: Table) {
    return `/staff/${restaurantSlug}/${branchSlug}/tables/${t.id}`;
  }

  function tableState(t: Table): "available" | "occupied" | "billing" {
    const s = sessionByTable.get(t.id);
    if (s?.bill_requested_at) return "billing";
    if (t.status === "billing") return "billing";
    if (t.status === "occupied" || occupiedTableIds.has(t.id) || s) {
      return "occupied";
    }
    return "available";
  }

  const grouped = new Map<string | null, Table[]>();
  for (const t of tables) {
    const z = t.zone_id ?? null;
    const arr = grouped.get(z) ?? [];
    arr.push(t);
    grouped.set(z, arr);
  }

  const sections: { id: string | null; name: string; tables: Table[] }[] = [
    ...zones
      .map((z) => ({ id: z.id, name: z.name, tables: grouped.get(z.id) ?? [] }))
      .filter((s) => s.tables.length > 0),
  ];
  const noZone = grouped.get(null) ?? [];
  if (noZone.length > 0) {
    sections.push({ id: null, name: "Sin zona", tables: noZone });
  }

  if (tables.length === 0) {
    return (
      <div className="p-6">
        <Card variant="default" className="border-dashed">
          <Card.Content className="!p-10 text-center">
            <p className="text-sm text-neutral-500">
              Sin mesas configuradas. Pedile al admin que agregue mesas.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/staff/${restaurantSlug}/${branchSlug}/order/new`}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 active:scale-[0.97] transition"
        >
          <Plus size={14} />
          Pedido para llevar
        </Link>
      </div>

      {sections.map((section) => (
        <section key={section.id ?? "no-zone"} className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {section.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {section.tables.map((t) => {
              const state = tableState(t);
              const session = sessionByTable.get(t.id);
              const cardTone =
                state === "billing"
                  ? "ring-2 ring-rose-300 bg-rose-50"
                  : state === "occupied"
                    ? "ring-2 ring-amber-200 bg-amber-50/60"
                    : "bg-white";
              return (
                <Link key={t.id} href={tableHref(t)} className="block">
                  <Card
                    variant="default"
                    className={`aspect-square transition-all hover:shadow-md active:scale-[0.97] ${cardTone}`}
                  >
                    <Card.Content className="!p-3 !flex !flex-col h-full justify-between">
                      <div className="flex items-start justify-between">
                        <p className="text-2xl font-bold text-neutral-900 leading-none">
                          {t.label}
                        </p>
                        <div className="flex items-center gap-0.5 text-xs text-neutral-500">
                          <Users size={11} /> {t.capacity ?? 4}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {state === "billing" && session?.bill_requested_at && (
                          <Chip
                            size="sm"
                            variant="soft"
                            color="danger"
                            className="w-full justify-center"
                          >
                            <Receipt size={11} />
                            Cuenta · {formatMinutes(minutesAgo(session.bill_requested_at))}
                          </Chip>
                        )}
                        {state === "occupied" && session && (
                          <>
                            {session.customer_name && (
                              <p className="truncate text-xs font-medium text-neutral-700">
                                {session.customer_name}
                              </p>
                            )}
                            <div
                              className="flex items-center gap-1 text-xs text-neutral-500"
                              suppressHydrationWarning
                            >
                              <Clock size={11} />
                              {formatMinutes(minutesAgo(session.opened_at))}
                            </div>
                          </>
                        )}
                        {state === "occupied" && !session && (
                          <Chip size="sm" variant="soft" color="warning">
                            Ocupada
                          </Chip>
                        )}
                        {state === "available" && (
                          <Chip size="sm" variant="soft">
                            Libre
                          </Chip>
                        )}
                      </div>
                    </Card.Content>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
