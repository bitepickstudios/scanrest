import { notFound } from "next/navigation";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import TicketView from "@/components/staff/TicketView";

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string; tableId: string }>;
}) {
  const { restaurantSlug, branchSlug, tableId } = await params;
  const { supabase, restaurant, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const { data: table } = await supabase
    .from("tables")
    .select("id, label, capacity, zone_id, status")
    .eq("id", tableId)
    .eq("branch_id", branch.id)
    .maybeSingle();

  if (!table) notFound();

  const { data: session } = await supabase
    .from("table_sessions")
    .select(
      "id, customer_name, party_size, opened_at, bill_requested_at, status, opened_by_staff_id"
    )
    .eq("table_id", table.id)
    .neq("status", "closed")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const [catsRes, prodsRes, overridesRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, category_id, name, description, price")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("branch_products")
      .select("product_id, available, price_override")
      .eq("branch_id", branch.id),
  ]);

  let submittedOrders: Array<{
    id: string;
    order_number: number;
    status: string;
    source: string;
    created_at: string;
    customer_name: string;
    items: Array<{
      id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      notes: string | null;
    }>;
  }> = [];

  if (session) {
    const { data: orders } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, source, created_at, customer_name, order_items(id, product_name, quantity, unit_price, notes)"
      )
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    submittedOrders = (orders ?? []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      status: o.status,
      source: o.source,
      created_at: o.created_at,
      customer_name: o.customer_name,
      items: (o.order_items ?? []) as typeof submittedOrders[number]["items"],
    }));
  }

  return (
    <TicketView
      restaurantSlug={restaurant.slug}
      branchSlug={branch.slug}
      branchId={branch.id}
      table={{
        id: table.id,
        label: table.label,
        capacity: table.capacity ?? null,
      }}
      session={session}
      submittedOrders={submittedOrders}
      categories={catsRes.data ?? []}
      products={prodsRes.data ?? []}
      overrides={overridesRes.data ?? []}
    />
  );
}
