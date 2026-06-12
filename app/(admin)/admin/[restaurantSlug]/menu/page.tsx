import MenuManager from "@/components/admin/MenuManager";
import { getRestaurantBySlug } from "@/lib/current-restaurant";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { supabase, restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id"
  );

  const [{ data: categories }, { data: branches }] = await Promise.all([
    supabase
      .from("categories")
      .select(`*, products(*, modifier_groups(*, modifiers(*)))`)
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("branches")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .eq("active", true)
      .order("is_default", { ascending: false })
      .order("name"),
  ]);

  const branchIds = (branches ?? []).map((b) => b.id);
  const { data: branchProducts } = branchIds.length
    ? await supabase
        .from("branch_products")
        .select("branch_id, product_id, available")
        .in("branch_id", branchIds)
    : { data: [] };

  return (
    <MenuManager
      restaurantId={restaurant.id}
      categories={(categories ?? []) as any}
      branches={branches ?? []}
      branchProducts={branchProducts ?? []}
    />
  );
}
