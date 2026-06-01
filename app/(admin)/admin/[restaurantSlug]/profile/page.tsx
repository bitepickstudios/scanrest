import ProfileForm from "@/components/admin/ProfileForm";
import PhoneMockup from "@/components/admin/PhoneMockup";
import { getRestaurantBySlug } from "@/lib/current-restaurant";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,360px)]">
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <ProfileForm restaurant={restaurant} />
      </div>
      {branch ? (
        <PhoneMockup slug={restaurant.slug} branchSlug={branch.slug} />
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
          Creá una sucursal para ver la vista previa del menú.
        </div>
      )}
    </div>
  );
}
