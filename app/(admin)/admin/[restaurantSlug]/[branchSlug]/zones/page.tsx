import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import ZonesManager from "@/components/admin/ZonesManager";

export default async function ZonesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const { data: zones } = await supabase
    .from("zones")
    .select("id, name, sort_order")
    .eq("branch_id", branch.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-800">Zonas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Organizá las mesas de {branch.name} por sección. Los mozos verán solo
          las zonas asignadas.
        </p>
      </div>
      <ZonesManager branchId={branch.id} zones={zones ?? []} />
    </div>
  );
}
