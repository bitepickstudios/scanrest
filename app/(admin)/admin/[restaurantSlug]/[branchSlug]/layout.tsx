import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import OrdersRealtimeNotifier from "@/components/admin/OrdersRealtimeNotifier";
import { Toaster } from "sileo";

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );
  return (
    <>
      <Toaster position="top-right" theme="light" />
      <OrdersRealtimeNotifier
        branchId={branch.id}
        restaurantSlug={restaurant.slug}
        branchSlug={branch.slug}
      />
      {children}
    </>
  );
}
