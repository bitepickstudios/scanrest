import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import OrderTaker from "@/components/staff/OrderTaker";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { table: tableId } = await searchParams;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const [catsRes, prodsRes, overridesRes, tableRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, category_id, name, description, price")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("branch_products")
      .select("product_id, available, price_override")
      .eq("branch_id", branch.id),
    tableId
      ? supabase
          .from("tables")
          .select("id, label, capacity")
          .eq("id", tableId)
          .eq("branch_id", branch.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const table = tableRes.data
    ? {
        id: tableRes.data.id,
        label: tableRes.data.label,
        capacity: tableRes.data.capacity ?? null,
      }
    : null;

  return (
    <OrderTaker
      restaurantSlug={restaurant.slug}
      branchSlug={branch.slug}
      branchId={branch.id}
      table={table}
      categories={catsRes.data ?? []}
      products={prodsRes.data ?? []}
      overrides={overridesRes.data ?? []}
    />
  );
}
