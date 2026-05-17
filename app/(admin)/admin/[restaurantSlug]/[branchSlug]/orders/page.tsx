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

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, order_items(*, order_item_modifiers(*)), tables(number, label)`)
    .eq("branch_id", branch.id)
    .neq("status", "delivered")
    .order("created_at", { ascending: true });

  const { data: delivered } = await supabase
    .from("orders")
    .select(`*, order_items(*, order_item_modifiers(*)), tables(number, label)`)
    .eq("branch_id", branch.id)
    .eq("status", "delivered")
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 bg-white px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">Pedidos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {branch.name} · Arrastrá las tarjetas para actualizar el estado.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialOrders={[...(orders ?? []), ...(delivered ?? [])] as any}
          mode={restaurant.mode as "table" | "foodcourt"}
          restaurantId={restaurant.id}
        />
      </div>
    </div>
  );
}
