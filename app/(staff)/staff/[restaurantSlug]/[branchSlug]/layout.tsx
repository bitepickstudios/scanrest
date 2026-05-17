import { redirect } from "next/navigation";
import {
  getRestaurantWithBranch,
  getCurrentStaffRole,
} from "@/lib/current-restaurant";

export default async function StaffLayout({
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
  const role = await getCurrentStaffRole(restaurant.id, branch.id);
  if (role !== "waiter" && role !== "admin" && role !== "superadmin") {
    redirect("/auth/login");
  }
  return <>{children}</>;
}
