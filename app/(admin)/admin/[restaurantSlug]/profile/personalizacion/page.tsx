import PersonalizationForm from "@/components/admin/PersonalizationForm";
import { getRestaurantBySlug } from "@/lib/current-restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function PersonalizacionPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(restaurantSlug, "*");

  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("slug")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <PersonalizationForm restaurant={restaurant} branchSlug={branch?.slug ?? null} />;
}
