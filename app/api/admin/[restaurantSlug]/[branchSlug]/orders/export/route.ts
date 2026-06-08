import { NextResponse } from "next/server";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import { toCSV } from "@/lib/utils/csv";

type OrderItemRow = { unit_price: number | string; quantity: number };
type TableRow = { label: string | null; number: number | null } | null;
type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string | null;
  status: string;
  source: string | null;
  created_at: string;
  order_items: OrderItemRow[];
  tables: TableRow;
};

export async function GET(
  request: Request,
  ctx: { params: Promise<{ restaurantSlug: string; branchSlug: string }> }
) {
  const { restaurantSlug, branchSlug } = await ctx.params;
  const { supabase, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const now = new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toParam ? new Date(toParam) : now;
  const toInclusive = new Date(to);
  toInclusive.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, status, source, created_at, order_items(unit_price, quantity), tables(label, number)"
    )
    .eq("branch_id", branch.id)
    .gte("created_at", from.toISOString())
    .lte("created_at", toInclusive.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as OrderRow[];

  const csvRows = rows.map((o) => {
    const items = o.order_items ?? [];
    const total = items.reduce(
      (s, it) => s + Number(it.unit_price) * it.quantity,
      0
    );
    const itemsCount = items.reduce((s, it) => s + it.quantity, 0);
    const tableLabel = o.tables
      ? o.tables.label ?? (o.tables.number != null ? `Mesa ${o.tables.number}` : "")
      : "";
    return {
      order_number: o.order_number,
      created_at: o.created_at,
      status: o.status,
      source: o.source ?? "",
      customer_name: o.customer_name ?? "",
      table: tableLabel,
      items_count: itemsCount,
      total: total.toFixed(2),
    };
  });

  const csv = toCSV(csvRows, [
    { key: "order_number", label: "#" },
    { key: "created_at", label: "Fecha" },
    { key: "status", label: "Estado" },
    { key: "source", label: "Origen" },
    { key: "customer_name", label: "Cliente" },
    { key: "table", label: "Mesa" },
    { key: "items_count", label: "Items" },
    { key: "total", label: "Total" },
  ]);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const filename = `pedidos_${branch.slug}_${fmt(from)}_${fmt(to)}.csv`;

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
