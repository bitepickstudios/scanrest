"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@/lib/types";
import { getCurrentRestaurant } from "@/lib/current-restaurant";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}
