import {
  getRestaurantBySlug,
  listBranchesForRestaurant,
} from "@/lib/current-restaurant";
import BranchesManager from "@/components/admin/BranchesManager";

export default async function SucursalesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id, name, slug"
  );
  const branches = await listBranchesForRestaurant(restaurant.id);

  return (
    <div>
      <p className="mb-4 text-sm text-neutral-600">
        Gestioná los locales de{" "}
        <span className="font-medium text-neutral-800">{restaurant.name}</span>.
        Cada sucursal tiene sus propias mesas, mozos y pedidos.
      </p>
      <BranchesManager
        restaurantSlug={restaurant.slug}
        branches={branches}
      />
    </div>
  );
}
