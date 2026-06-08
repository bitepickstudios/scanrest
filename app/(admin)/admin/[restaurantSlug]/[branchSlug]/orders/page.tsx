import KanbanBoard from "@/components/admin/KanbanBoard";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, order_items(*, order_item_modifiers(*)), tables(number, label)`)
    .eq("branch_id", branch.id)
    .gte("created_at", since30.toISOString())
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-neutral-200 px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">Pedidos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {branch.name} · Arrastrá las tarjetas para actualizar el estado.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <KanbanBoard
          initialOrders={(orders ?? []) as any}
          mode={restaurant.mode as "table" | "foodcourt"}
          restaurantId={restaurant.id}
        />
      </div>
    </div>
  );
}
