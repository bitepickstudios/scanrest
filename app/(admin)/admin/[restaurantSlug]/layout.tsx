import Sidebar from "@/components/admin/Sidebar";
import {
  getRestaurantBySlug,
  listOwnedRestaurants,
} from "@/lib/current-restaurant";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id, name, slug"
  );
  const { restaurants } = await listOwnedRestaurants();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar restaurant={restaurant} ownedCount={restaurants.length} />
      <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
    </div>
  );
}
