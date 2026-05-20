import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import MenuOverridesManager from "@/components/admin/MenuOverridesManager";

export default async function MenuDisponibilidadPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const [catsRes, prodsRes, overridesRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, category_id, name, price")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("branch_products")
      .select("product_id, available, price_override")
      .eq("branch_id", branch.id),
  ]);

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-600">
        <span className="font-medium text-neutral-800">{branch.name}</span> —
        desactivá productos que no se venden en esta sucursal o ajustá su precio.
      </p>
      <MenuOverridesManager
        branchId={branch.id}
        categories={catsRes.data ?? []}
        products={prodsRes.data ?? []}
        overrides={overridesRes.data ?? []}
      />
    </div>
  );
}
