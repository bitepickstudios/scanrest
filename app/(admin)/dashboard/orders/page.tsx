import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KanbanBoard from "@/components/admin/KanbanBoard";

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, mode")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/register");

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, order_items(*, order_item_modifiers(*))`)
    .eq("restaurant_id", restaurant.id)
    .neq("status", "delivered")
    .order("created_at", { ascending: true });

  const { data: delivered } = await supabase
    .from("orders")
    .select(`*, order_items(*, order_item_modifiers(*))`)
    .eq("restaurant_id", restaurant.id)
    .eq("status", "delivered")
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 bg-white px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">Pedidos</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Arrastrá las tarjetas para actualizar el estado.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialOrders={[...(orders ?? []), ...(delivered ?? [])] as any}
          mode={restaurant.mode as "table" | "foodcourt"}
        />
      </div>
    </div>
  );
}
