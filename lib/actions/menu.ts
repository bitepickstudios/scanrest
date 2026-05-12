"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";

async function getRestaurantId() {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");
  return {
    supabase,
    restaurantId: restaurant.id,
    menuPath: `/admin/${restaurant.slug}/menu`,
  };
}

// ── CATEGORIES ──────────────────────────────────────────────

export async function createCategory(name: string) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("categories")
    .insert({ restaurant_id: restaurantId, name });
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

export async function updateCategory(id: string, name: string) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

export async function deleteCategory(id: string) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

// ── PRODUCTS ─────────────────────────────────────────────────

export async function createProduct(data: {
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
}) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("products")
    .insert({ restaurant_id: restaurantId, ...data });
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

export async function updateProduct(
  id: string,
  data: {
    category_id: string | null;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    available: boolean;
  }
) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("products")
    .update(data)
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

export async function deleteProduct(id: string) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

export async function toggleProductAvailability(
  id: string,
  available: boolean
) {
  const { supabase, restaurantId, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("products")
    .update({ available })
    .eq("id", id)
    .eq("restaurant_id", restaurantId);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

// ── MODIFIER GROUPS ───────────────────────────────────────────

export async function createModifierGroup(
  productId: string,
  data: { name: string; required: boolean; max_selections: number }
) {
  const { supabase, menuPath } = await getRestaurantId();
  const { data: group, error } = await supabase
    .from("modifier_groups")
    .insert({ product_id: productId, ...data })
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
  return group;
}

export async function deleteModifierGroup(id: string) {
  const { supabase, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("modifier_groups")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

// ── MODIFIERS ─────────────────────────────────────────────────

export async function createModifier(
  groupId: string,
  data: { name: string; price_delta: number }
) {
  const { supabase, menuPath } = await getRestaurantId();
  const { error } = await supabase
    .from("modifiers")
    .insert({ group_id: groupId, ...data });
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}

export async function deleteModifier(id: string) {
  const { supabase, menuPath } = await getRestaurantId();
  const { error } = await supabase.from("modifiers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(menuPath);
}
