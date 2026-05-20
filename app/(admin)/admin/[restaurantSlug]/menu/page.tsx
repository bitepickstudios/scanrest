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

  const { data: categories } = await supabase
    .from("categories")
    .select(`*, products(*, modifier_groups(*, modifiers(*)))`)
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  return (
    <MenuManager
      restaurantId={restaurant.id}
      categories={(categories ?? []) as any}
    />
  );
}
