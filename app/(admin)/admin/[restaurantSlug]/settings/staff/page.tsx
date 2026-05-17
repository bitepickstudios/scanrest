import {
  getRestaurantBySlug,
  listBranchesForRestaurant,
} from "@/lib/current-restaurant";
import StaffManager from "@/components/admin/StaffManager";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { supabase, restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id, name, slug"
  );
  const branches = await listBranchesForRestaurant(restaurant.id);
  const branchIds = branches.map((b) => b.id);

  const [staffRes, zonesRes, staffZonesRes] = await Promise.all([
    supabase
      .from("staff")
      .select("id, user_id, display_name, role, branch_id, active")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: true }),
    branchIds.length > 0
      ? supabase
          .from("zones")
          .select("id, name, branch_id")
          .in("branch_id", branchIds)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; name: string; branch_id: string }[] }),
    supabase.from("staff_zones").select("staff_id, zone_id"),
  ]);

  const zoneMap = new Map<string, string[]>();
  for (const row of staffZonesRes.data ?? []) {
    const arr = zoneMap.get(row.staff_id) ?? [];
    arr.push(row.zone_id);
    zoneMap.set(row.staff_id, arr);
  }

  const staffWithZones = (staffRes.data ?? []).map((s) => ({
    ...s,
    zone_ids: zoneMap.get(s.id) ?? [],
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-800">Equipo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestioná admins y mozos de {restaurant.name}. Los mozos solo ven la
          sucursal y zonas que se les asignen.
        </p>
      </div>
      <StaffManager
        staff={staffWithZones}
        branches={branches.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
        zones={zonesRes.data ?? []}
      />
    </div>
  );
}
