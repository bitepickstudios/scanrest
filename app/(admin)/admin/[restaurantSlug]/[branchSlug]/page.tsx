import Link from "next/link";
import { Store, UtensilsCrossed, Table2, ClipboardList } from "lucide-react";
import { Card } from "@heroui/react";
import DashboardQuickActions from "@/components/admin/DashboardQuickActions";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";

export default async function BranchHomePage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const [{ count: productCount }, { count: tableCount }, { count: orderCount }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id),
      supabase
        .from("tables")
        .select("*", { count: "exact", head: true })
        .eq("branch_id", branch.id),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("branch_id", branch.id),
    ]);

  const base = `/admin/${restaurant.slug}/${branch.slug}`;
  const cards = [
    { label: "Productos", value: productCount ?? 0, icon: UtensilsCrossed, href: `/admin/${restaurant.slug}/menu` },
    { label: "Mesas", value: tableCount ?? 0, icon: Table2, href: `${base}/tables` },
    { label: "Pedidos totales", value: orderCount ?? 0, icon: ClipboardList, href: `${base}/orders` },
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">
        {restaurant.name} — {branch.name}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Sucursal · Modo:{" "}
        {restaurant.mode === "table" ? "Restaurante con mesas" : "Food court"}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="group">
            <Card variant="default" className="transition-shadow group-hover:shadow-md">
              <Card.Header>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Icon size={16} />
                  <Card.Title className="text-xs font-medium uppercase tracking-wider">{label}</Card.Title>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-3xl font-bold text-neutral-800">{value}</p>
              </Card.Content>
            </Card>
          </Link>
        ))}
      </div>

      <Card variant="default" className="mt-8">
        <Card.Header>
          <div className="flex items-center gap-2 text-neutral-400">
            <Store size={16} />
            <Card.Title className="text-xs font-medium uppercase tracking-wider">Accesos rápidos</Card.Title>
          </div>
        </Card.Header>
        <Card.Content>
          <DashboardQuickActions slug={restaurant.slug} branchSlug={branch.slug} />
        </Card.Content>
      </Card>
    </div>
  );
}
