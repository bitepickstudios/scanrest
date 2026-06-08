import Link from "next/link";
import { Card } from "@heroui/react";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import KpiCard from "@/components/admin/dashboard/KpiCard";
import BarChart from "@/components/admin/dashboard/BarChart";
import LineChart from "@/components/admin/dashboard/LineChart";
import DashboardTabs from "@/components/admin/dashboard/DashboardTabs";
import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import RecentOrdersTable, {
  type RecentOrderRow,
} from "@/components/admin/dashboard/RecentOrdersTable";

type OrderItem = { unit_price: number | string; quantity: number };
type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string | null;
  table_id: string | null;
  source: string | null;
  status: string;
  created_at: string;
  order_items: OrderItem[];
};

type Period = "day" | "7d" | "30d" | "month" | "custom";

function resolveRange(
  period: Period,
  fromParam: string | undefined,
  toParam: string | undefined,
  now: Date
) {
  if (period === "custom" && fromParam && toParam) {
    const start = new Date(`${fromParam}T00:00:00`);
    const end = new Date(`${toParam}T23:59:59.999`);
    const span = end.getTime() - start.getTime();
    const prev = new Date(start.getTime() - span);
    return { start, end, prev, prevEnd: start };
  }
  const today0 = new Date(now);
  today0.setHours(0, 0, 0, 0);
  if (period === "day") {
    const end = new Date(today0);
    end.setHours(23, 59, 59, 999);
    const prev = new Date(today0);
    prev.setDate(prev.getDate() - 1);
    return { start: today0, end, prev, prevEnd: today0 };
  }
  if (period === "7d") {
    const start = new Date(today0);
    start.setDate(start.getDate() - 6);
    const prev = new Date(start);
    prev.setDate(prev.getDate() - 7);
    return { start, end: now, prev, prevEnd: start };
  }
  if (period === "30d") {
    const start = new Date(today0);
    start.setDate(start.getDate() - 29);
    const prev = new Date(start);
    prev.setDate(prev.getDate() - 30);
    return { start, end: now, prev, prevEnd: start };
  }
  // month default
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { start, end: now, prev, prevEnd: start };
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function BranchHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const sp = await searchParams;
  const periodParam = (Array.isArray(sp.period) ? sp.period[0] : sp.period) as
    | Period
    | undefined;
  const period: Period = periodParam ?? "month";
  const fromParam = Array.isArray(sp.from) ? sp.from[0] : sp.from;
  const toParam = Array.isArray(sp.to) ? sp.to[0] : sp.to;

  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const now = new Date();
  const { start: startCurr, end: endCurr, prev: startPrev, prevEnd: endPrev } =
    resolveRange(period, fromParam, toParam, now);
  const since365 = new Date(now);
  since365.setDate(since365.getDate() - 365);

  const [ordersRes, reservationsRes, tablesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, table_id, source, status, created_at, order_items(unit_price, quantity)"
      )
      .eq("branch_id", branch.id)
      .gte("created_at", since365.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("reservations")
      .select("id, customer_name, party_size, reservation_at, status")
      .eq("branch_id", branch.id)
      .gte("reservation_at", startPrev.toISOString()),
    supabase.from("tables").select("id, label").eq("branch_id", branch.id),
  ]);

  const orders = (ordersRes.data ?? []) as OrderRow[];
  const tableMap = new Map(
    (tablesRes.data ?? []).map((t) => [t.id as string, t.label as string])
  );

  const orderTotal = (o: OrderRow) =>
    (o.order_items ?? []).reduce(
      (s, i) => s + Number(i.unit_price) * i.quantity,
      0
    );

  const currOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= startCurr && d <= endCurr;
  });
  const prevOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= startPrev && d < endPrev;
  });

  const sumTotals = (rows: OrderRow[]) =>
    rows.reduce((s, o) => s + orderTotal(o), 0);

  const currIngresos = sumTotals(currOrders);
  const prevIngresos = sumTotals(prevOrders);
  const currCount = currOrders.length;
  const prevCount = prevOrders.length;
  const currTicket = currCount > 0 ? currIngresos / currCount : 0;
  const prevTicket = prevCount > 0 ? prevIngresos / prevCount : 0;

  const reservations = reservationsRes.data ?? [];
  const currReservas = reservations.filter((r) => {
    const d = new Date(r.reservation_at as string);
    return d >= startCurr && d <= endCurr;
  }).length;
  const prevReservas = reservations.filter((r) => {
    const d = new Date(r.reservation_at as string);
    return d >= startPrev && d < endPrev;
  }).length;

  const deltaPct = (curr: number, prev: number): number | null => {
    if (prev === 0) return curr === 0 ? 0 : null;
    return ((curr - prev) / prev) * 100;
  };

  const last14: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od >= d && od < next;
    }).length;
    last14.push({ label: String(d.getDate()).padStart(2, "0"), value: count });
  }

  const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const last12: { label: string; clientCount: number; waiterCount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const inMonth = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od >= d && od < next;
    });
    last12.push({
      label: monthLabels[d.getMonth()],
      clientCount: inMonth.filter((o) => o.source !== "waiter").length,
      waiterCount: inMonth.filter((o) => o.source === "waiter").length,
    });
  }

  const recentRows: RecentOrderRow[] = orders.slice(0, 8).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    table_label: o.table_id ? tableMap.get(o.table_id) ?? null : null,
    total: orderTotal(o),
    status: o.status,
    source: o.source,
    created_at: o.created_at,
  }));

  const base = `/admin/${restaurant.slug}/${branch.slug}`;
  const hour = now.getHours();
  const greet =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const overview = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ingresos"
          value={`Gs. ${currIngresos.toLocaleString("es-PY")}`}
          deltaPct={deltaPct(currIngresos, prevIngresos)}
        />
        <KpiCard
          label="Pedidos"
          value={currCount.toLocaleString("es-PY")}
          deltaPct={deltaPct(currCount, prevCount)}
        />
        <KpiCard
          label="Ticket promedio"
          value={`Gs. ${Math.round(currTicket).toLocaleString("es-PY")}`}
          deltaPct={deltaPct(currTicket, prevTicket)}
        />
        <KpiCard
          label="Reservas"
          value={currReservas.toLocaleString("es-PY")}
          deltaPct={deltaPct(currReservas, prevReservas)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card variant="default">
          <Card.Header>
            <Card.Title className="text-base font-semibold text-neutral-800">
              Pedidos por día
            </Card.Title>
            <Card.Description className="text-xs text-neutral-500">
              Últimos 14 días
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <BarChart data={last14} />
          </Card.Content>
        </Card>

        <Card variant="default">
          <Card.Header>
            <div className="flex items-start justify-between">
              <div>
                <Card.Title className="text-base font-semibold text-neutral-800">
                  Origen de pedidos
                </Card.Title>
                <Card.Description className="text-xs text-neutral-500">
                  Últimos 12 meses
                </Card.Description>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-neutral-900" />
                  Cliente
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: "oklch(82% 0.12 155)" }}
                  />
                  Mozo
                </span>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <LineChart
              data={last12.map((m) => ({ label: m.label }))}
              series={[
                {
                  key: "cliente",
                  color: "oklch(21% 0.0015 155)",
                  values: last12.map((m) => m.clientCount),
                },
                {
                  key: "mozo",
                  color: "oklch(82% 0.12 155)",
                  values: last12.map((m) => m.waiterCount),
                },
              ]}
            />
          </Card.Content>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-neutral-800">
              Pedidos recientes
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
              {currCount}
            </span>
          </div>
          <Link
            href={`${base}/orders`}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Ver todos →
          </Link>
        </div>
        <RecentOrdersTable orders={recentRows} ordersHref={`${base}/orders`} />
      </div>
    </div>
  );

  const STATUS_COUNTS: Record<string, number> = {
    new: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of currOrders) {
    if (o.status in STATUS_COUNTS) STATUS_COUNTS[o.status] += 1;
  }
  const STATUS_LABEL: Record<string, string> = {
    new: "Nuevos",
    preparing: "Preparando",
    ready: "Listos",
    delivered: "Entregados",
    cancelled: "Cancelados",
  };

  const pedidosPanel = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {Object.entries(STATUS_COUNTS).map(([key, count]) => (
          <Card key={key} variant="default">
            <Card.Content className="!p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {STATUS_LABEL[key]}
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">
                {count}
              </p>
            </Card.Content>
          </Card>
        ))}
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">
            Pedidos del período
          </h2>
          <Link
            href={`${base}/orders`}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Ver todos →
          </Link>
        </div>
        <RecentOrdersTable
          orders={currOrders.slice(0, 10).map((o) => ({
            id: o.id,
            order_number: o.order_number,
            customer_name: o.customer_name,
            table_label: o.table_id ? tableMap.get(o.table_id) ?? null : null,
            total: orderTotal(o),
            status: o.status,
            source: o.source,
            created_at: o.created_at,
          }))}
          ordersHref={`${base}/orders`}
        />
      </div>
    </div>
  );

  const upcomingReservas = reservations
    .filter((r) => new Date(r.reservation_at as string) >= now)
    .slice(0, 7);
  const RES_STATUS_LABEL: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    seated: "Sentados",
    completed: "Completada",
    cancelled: "Cancelada",
    "no-show": "No-show",
  };
  const reservasPanel = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card variant="default">
          <Card.Content className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Total período
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">
              {currReservas}
            </p>
          </Card.Content>
        </Card>
        <Card variant="default">
          <Card.Content className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Próximas
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">
              {upcomingReservas.length}
            </p>
          </Card.Content>
        </Card>
        <Card variant="default">
          <Card.Content className="!p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Confirmadas
            </p>
            <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">
              {
                reservations.filter(
                  (r) =>
                    r.status === "confirmed" &&
                    new Date(r.reservation_at as string) >= startCurr &&
                    new Date(r.reservation_at as string) <= endCurr
                ).length
              }
            </p>
          </Card.Content>
        </Card>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-800">
            Próximas reservas
          </h2>
          <Link
            href={`${base}/reservations`}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            Ver todas →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {upcomingReservas.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-400">
              No hay reservas próximas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Personas</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {upcomingReservas.map((r) => (
                  <tr key={r.id as string} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-800">
                      {(r.customer_name as string | null) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700 tabular-nums">
                      {(r.party_size as number | null) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {new Date(r.reservation_at as string).toLocaleString(
                        "es-PY",
                        { dateStyle: "short", timeStyle: "short" }
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                        {RES_STATUS_LABEL[r.status as string] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-8">
      <DashboardHeader
        greeting={`${greet}, ${restaurant.name}`}
        ordersHref={`${base}/orders`}
        exportHref={`/api/admin/${restaurant.slug}/${branch.slug}/orders/export`}
        period={period}
        from={fmtDate(startCurr)}
        to={fmtDate(endCurr)}
      />
      <DashboardTabs
        overview={overview}
        pedidos={pedidosPanel}
        reservas={reservasPanel}
      />
    </div>
  );
}
