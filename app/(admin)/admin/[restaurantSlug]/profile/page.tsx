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
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">
        Perfil del restaurante
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Esta información aparece en el storefront que ven tus clientes.
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-neutral-200 bg-white p-6">
        <ProfileForm restaurant={restaurant} />
      </div>
    </div>
  );
}
