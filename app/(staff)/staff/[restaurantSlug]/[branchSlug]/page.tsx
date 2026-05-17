import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import TableGrid from "@/components/staff/TableGrid";

export const dynamic = "force-dynamic";

export default async function StaffHomePage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const [tablesRes, zonesRes, ordersRes] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("branch_id", branch.id)
      .eq("active", true)
      .order("number", { ascending: true }),
    supabase
      .from("zones")
      .select("id, name")
      .eq("branch_id", branch.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("orders")
      .select("table_id, status")
      .eq("branch_id", branch.id)
      .neq("status", "delivered"),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <h1 className="text-base font-semibold text-neutral-900">
          {restaurant.name} · {branch.name}
        </h1>
        <p className="text-xs text-neutral-500">
          Tocá una mesa para tomar el pedido.
        </p>
      </header>
      <TableGrid
        restaurantSlug={restaurant.slug}
        branchSlug={branch.slug}
        tables={tablesRes.data ?? []}
        zones={zonesRes.data ?? []}
        activeOrders={(ordersRes.data ?? []) as { table_id: string | null; status: "new" | "preparing" | "ready" | "delivered" }[]}
      />
    </div>
  );
}
