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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-800">Sucursales</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestioná los locales de {restaurant.name}. Cada sucursal tiene sus
          propias mesas, mozos y pedidos.
        </p>
      </div>

      <BranchesManager
        restaurantSlug={restaurant.slug}
        branches={branches}
      />
    </div>
  );
}
