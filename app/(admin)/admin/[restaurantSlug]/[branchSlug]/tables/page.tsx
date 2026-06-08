import TablesManager from "@/components/admin/TablesManager";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [tablesRes, zonesRes, openSessionsRes, closedSessionsRes] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("branch_id", branch.id)
      .order("number", { ascending: true }),
    supabase
      .from("zones")
      .select("id, name, sort_order")
      .eq("branch_id", branch.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("table_sessions")
      .select(
        `id, status, opened_at, closed_at, customer_name, table_id, party_size,
         orders(id, order_number, status, customer_name, created_at,
           order_items(id, product_name, quantity, unit_price,
             order_item_modifiers(price_delta)))`
      )
      .eq("branch_id", branch.id)
      .neq("status", "closed")
      .order("opened_at", { ascending: false }),
    supabase
      .from("table_sessions")
      .select(
        `id, status, opened_at, closed_at, customer_name, table_id,
         tables(number, label),
         orders(id, order_items(id, quantity, unit_price,
           order_item_modifiers(price_delta)))`
      )
      .eq("branch_id", branch.id)
      .eq("status", "closed")
      .gte("opened_at", since30.toISOString())
      .order("closed_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">
          {restaurant.mode === "table" ? "Mesas" : "QR del local"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {branch.name} ·{" "}
          {restaurant.mode === "table"
            ? "Gestioná mesas, pedidos activos, sesiones y zonas."
            : "Un solo QR para que los clientes hagan su pedido y retiren en el mostrador."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TablesManager
          tables={tablesRes.data ?? []}
          restaurantSlug={restaurant.slug}
          branchSlug={branch.slug}
          branchId={branch.id}
          restaurantId={restaurant.id}
          zones={zonesRes.data ?? []}
          mode={restaurant.mode as "table" | "foodcourt"}
          openSessions={(openSessionsRes.data ?? []) as any}
          closedSessions={(closedSessionsRes.data ?? []) as any}
        />
      </div>
    </div>
  );
}
