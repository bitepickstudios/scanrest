"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import type { Table } from "@/lib/types";

type Zone = { id: string; name: string };
type Order = {
  table_id: string | null;
  status: "new" | "preparing" | "ready" | "delivered";
};

export default function TableGrid({
  restaurantSlug,
  branchSlug,
  tables,
  zones,
  activeOrders,
}: {
  restaurantSlug: string;
  branchSlug: string;
  tables: Table[];
  zones: Zone[];
  activeOrders: Order[];
}) {
  const occupiedTableIds = new Set(
    activeOrders
      .filter((o) => o.table_id && o.status !== "delivered")
      .map((o) => o.table_id as string)
  );

  function tableHref(t: Table) {
    return `/staff/${restaurantSlug}/${branchSlug}/tables/${t.id}`;
  }

  function tableStatus(t: Table): "available" | "occupied" | "billing" {
    if (t.status === "billing") return "billing";
    if (t.status === "occupied" || occupiedTableIds.has(t.id)) return "occupied";
    return "available";
  }

  const STATE_STYLES: Record<
    "available" | "occupied" | "billing",
    { card: string; chip: string; label: string }
  > = {
    available: {
      card: "border-neutral-200 bg-white hover:border-neutral-400",
      chip: "",
      label: "",
    },
    occupied: {
      card: "border-amber-300 bg-amber-50",
      chip: "bg-amber-200 text-amber-900",
      label: "Ocupada",
    },
    billing: {
      card: "border-rose-300 bg-rose-50",
      chip: "bg-rose-200 text-rose-900",
      label: "Cuenta",
    },
  };

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
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-10 text-center">
          <p className="text-sm text-neutral-500">
            Sin mesas configuradas. Pedile al admin que agregue mesas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/staff/${restaurantSlug}/${branchSlug}/order/new`}
          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={14} /> Pedido para llevar
        </Link>
      </div>

      {sections.map((section) => (
        <section key={section.id ?? "no-zone"} className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {section.name}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {section.tables.map((t) => {
              const state = tableStatus(t);
              const styles = STATE_STYLES[state];
              return (
                <Link
                  key={t.id}
                  href={tableHref(t)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${styles.card}`}
                >
                  <p className="text-lg font-bold text-neutral-900">
                    {t.label}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <Users size={11} /> {t.capacity ?? 4}
                  </div>
                  {styles.label && (
                    <span
                      className={`mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles.chip}`}
                    >
                      {styles.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
