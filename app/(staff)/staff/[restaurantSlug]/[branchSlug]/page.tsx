import { getRestaurantWithBranch } from "@/lib/current-restaurant";

export default async function StaffHomePage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">
        Panel mozo · {restaurant.name}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Sucursal {branch.name} — vista de mesas próximamente.
      </p>
    </div>
  );
}
