import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import MenuOverridesManager from "@/components/admin/MenuOverridesManager";

export default async function MenuOverridesPage({
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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-800">
          Disponibilidad y precios
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {branch.name} — overrides sobre el menú maestro. Desactivá productos
          que no se venden en esta sucursal o ajustá su precio.
        </p>
      </div>
      <MenuOverridesManager
        branchId={branch.id}
        categories={catsRes.data ?? []}
        products={prodsRes.data ?? []}
        overrides={overridesRes.data ?? []}
      />
    </div>
  );
}
