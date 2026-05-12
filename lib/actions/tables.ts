"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";

async function getRestaurant() {
  const { supabase, restaurant } = await getCurrentRestaurant(
    "id, slug, mode"
  );
  return { supabase, restaurant: restaurant as { id: string; slug: string; mode: string } };
}

export async function createTables(count: number) {
  const { supabase, restaurant } = await getRestaurant();

  const { data: existing } = await supabase
    .from("tables")
    .select("number")
    .eq("restaurant_id", restaurant.id)
    .order("number", { ascending: false })
    .limit(1);

  const startNumber = existing && existing.length > 0 ? existing[0].number + 1 : 1;

  const rows = Array.from({ length: count }, (_, i) => ({
    restaurant_id: restaurant.id,
    number: startNumber + i,
    label: `Mesa ${startNumber + i}`,
  }));

  const { error } = await supabase.from("tables").insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}/tables`);
}

export async function deleteTable(id: string) {
  const { supabase, restaurant } = await getRestaurant();
  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}/tables`);
}

export async function toggleTableActive(id: string, active: boolean) {
  const { supabase, restaurant } = await getRestaurant();
  const { error } = await supabase
    .from("tables")
    .update({ active })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}/tables`);
}
