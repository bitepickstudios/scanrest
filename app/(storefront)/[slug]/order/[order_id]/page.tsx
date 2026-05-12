import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OrderTracker from "@/components/storefront/OrderTracker";

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ slug: string; order_id: string }>;
}) {
  const { slug, order_id } = await params;

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`*, order_items(*, order_item_modifiers(*))`)
    .eq("id", order_id)
    .single();

  if (!order) notFound();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, logo_url, mode")
    .eq("slug", slug)
    .single();

  if (!restaurant) notFound();

  return (
    <OrderTracker
      initialOrder={order}
      restaurant={restaurant}
      orderId={order_id}
      slug={slug}
    />
  );
}
