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
    return `/staff/${restaurantSlug}/${branchSlug}/order/new?table=${t.id}`;
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
              const occupied = occupiedTableIds.has(t.id);
              return (
                <Link
                  key={t.id}
                  href={tableHref(t)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition-all ${
                    occupied
                      ? "border-amber-300 bg-amber-50"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <p className="text-lg font-bold text-neutral-900">
                    {t.label}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <Users size={11} /> {t.capacity ?? 4}
                  </div>
                  {occupied && (
                    <span className="mt-2 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                      Ocupada
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
