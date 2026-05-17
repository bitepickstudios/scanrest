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

  const [tablesRes, zonesRes] = await Promise.all([
    supabase
      .from("tables")
      .select("*")
      .eq("branch_id", branch.id)
      .order("number", { ascending: true }),
    supabase
      .from("zones")
      .select("id, name")
      .eq("branch_id", branch.id)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 bg-white px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">
          {restaurant.mode === "table" ? "Mesas y QRs" : "QR del local"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {branch.name} ·{" "}
          {restaurant.mode === "table"
            ? "Generá y descargá los QRs para pegar en cada mesa."
            : "Un solo QR para que los clientes hagan su pedido y retiren en el mostrador."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TablesManager
          tables={tablesRes.data ?? []}
          restaurantSlug={restaurant.slug}
          branchSlug={branch.slug}
          branchId={branch.id}
          zones={zonesRes.data ?? []}
          mode={restaurant.mode as "table" | "foodcourt"}
        />
      </div>
    </div>
  );
}
