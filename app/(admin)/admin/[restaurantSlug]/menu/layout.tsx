import NavTabs from "@/components/admin/NavTabs";
import { menuTabs } from "@/components/admin/section-tabs-config";
import { getRestaurantBySlug, getDefaultBranch } from "@/lib/current-restaurant";

export default async function MenuLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(restaurantSlug, "id");
  const defaultBranch = await getDefaultBranch(restaurant.id);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">Menú</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Gestioná categorías, productos y disponibilidad por sucursal.
      </p>
      <div className="mt-6 mb-6">
        <NavTabs tabs={menuTabs(restaurantSlug, defaultBranch?.slug ?? "")} />
      </div>
      {children}
    </div>
  );
}
