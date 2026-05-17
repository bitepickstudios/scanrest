import { getRestaurantWithBranch } from "@/lib/current-restaurant";

export default async function BranchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  await getRestaurantWithBranch(restaurantSlug, branchSlug);
  return <>{children}</>;
}
