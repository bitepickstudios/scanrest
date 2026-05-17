"use client";

import Link from "next/link";
import { Eye } from "lucide-react";

export type RecentOrderRow = {
  id: string;
  order_number: number;
  customer_name: string | null;
  table_label: string | null;
  total: number;
  status: string;
  source: string | null;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-amber-50 text-amber-700" },
  preparing: { label: "Preparando", cls: "bg-blue-50 text-blue-700" },
  ready: { label: "Listo", cls: "bg-emerald-50 text-emerald-700" },
  served: { label: "Servido", cls: "bg-neutral-100 text-neutral-700" },
  paid: { label: "Pagado", cls: "bg-neutral-900 text-white" },
  cancelled: { label: "Cancelado", cls: "bg-rose-50 text-rose-700" },
};

export default function RecentOrdersTable({
  orders,
  ordersHref,
}: {
  orders: RecentOrderRow[];
  ordersHref: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
          <tr>
            <th className="px-4 py-3">Orden</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Mesa</th>
            <th className="px-4 py-3">Origen</th>
            <th className="px-4 py-3 text-right">Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {orders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                Sin pedidos aún.
              </td>
            </tr>
          )}
          {orders.map((o) => {
            const meta = STATUS_META[o.status] ?? {
              label: o.status,
              cls: "bg-neutral-100 text-neutral-700",
            };
            return (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-800 tabular-nums">
                  #{o.order_number}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {o.customer_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {o.table_label ?? "—"}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {o.source === "waiter" ? "Mozo" : "Cliente"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-800">
                  Gs. {o.total.toLocaleString("es-PY")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={ordersHref}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                    aria-label="Ver"
                  >
                    <Eye size={14} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
