import { redirect } from "next/navigation";
import {
  getRestaurantBySlug,
  getDefaultBranch,
  listBranchesForRestaurant,
} from "@/lib/current-restaurant";

export default async function AdminHomePage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id, slug"
  );

  const branches = await listBranchesForRestaurant(restaurant.id);
  const active = branches.filter((b) => b.active);

  if (active.length === 0) {
    redirect(`/admin/${restaurant.slug}/profile/sucursales`);
  }

  const def = await getDefaultBranch(restaurant.id);
  const target = def ?? active[0];
  redirect(`/admin/${restaurant.slug}/${target.slug}`);
}
