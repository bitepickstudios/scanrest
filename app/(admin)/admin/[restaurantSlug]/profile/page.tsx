import ProfileForm from "@/components/admin/ProfileForm";
import { getRestaurantBySlug } from "@/lib/current-restaurant";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(restaurantSlug, "*");

  return (
    <div className="max-w-2xl rounded-xl border border-neutral-200 bg-white p-6">
      <ProfileForm restaurant={restaurant} />
    </div>
  );
}
