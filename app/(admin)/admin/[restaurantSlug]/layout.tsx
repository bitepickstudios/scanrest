import Sidebar from "@/components/admin/Sidebar";
import OrdersRealtimeNotifier from "@/components/admin/OrdersRealtimeNotifier";
import { Toaster } from "sileo";
import {
  getRestaurantBySlug,
  listOwnedRestaurants,
  getDefaultBranch,
  listBranchesForRestaurant,
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
    "id, name, slug, logo_url"
  );
  const { restaurants } = await listOwnedRestaurants();
  const defaultBranch = await getDefaultBranch(restaurant.id);
  const branches = await listBranchesForRestaurant(restaurant.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <Toaster position="top-right" theme="light" />
      <OrdersRealtimeNotifier
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        defaultBranchSlug={defaultBranch?.slug}
      />
      <Sidebar
        restaurant={restaurant}
        ownedCount={restaurants.length}
        defaultBranchSlug={defaultBranch?.slug}
        branches={branches.map((b) => ({
          id: b.id,
          slug: b.slug,
          name: b.name,
          is_default: b.is_default,
          active: b.active,
        }))}
      />
      <main className="flex-1 overflow-y-auto bg-neutral-50">{children}</main>
    </div>
  );
}
