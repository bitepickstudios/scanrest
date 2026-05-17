"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";
import type { Database } from "@/lib/database.types";

type ZoneUpdate = Database["public"]["Tables"]["zones"]["Update"];

async function getRestaurant() {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");
  return { supabase, restaurant: restaurant as { id: string; slug: string } };
}

async function assertBranchOwnership(
  supabase: Awaited<ReturnType<typeof getRestaurant>>["supabase"],
  branchId: string,
  restaurantId: string
) {
  const { data, error } = await supabase
    .from("branches")
    .select("id")
    .eq("id", branchId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (error || !data) throw new Error("Sucursal no encontrada o sin acceso.");
}

export async function createZone(
  branchId: string,
  input: { name: string; sortOrder?: number }
) {
  const { supabase, restaurant } = await getRestaurant();
  await assertBranchOwnership(supabase, branchId, restaurant.id);

  const name = input.name.trim();
  if (!name) throw new Error("El nombre de la zona es obligatorio.");

  const { error } = await supabase.from("zones").insert({
    branch_id: branchId,
    name,
    sort_order: input.sortOrder ?? 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function updateZone(
  id: string,
  patch: Omit<ZoneUpdate, "id" | "branch_id" | "created_at">
) {
  const { supabase, restaurant } = await getRestaurant();

  const { data: zone, error: fetchError } = await supabase
    .from("zones")
    .select("branch_id")
    .eq("id", id)
    .single();

  if (fetchError || !zone) throw new Error("Zona no encontrada.");
  await assertBranchOwnership(supabase, zone.branch_id, restaurant.id);

  const { error } = await supabase.from("zones").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function deleteZone(id: string) {
  const { supabase, restaurant } = await getRestaurant();

  const { data: zone, error: fetchError } = await supabase
    .from("zones")
    .select("branch_id")
    .eq("id", id)
    .single();

  if (fetchError || !zone) throw new Error("Zona no encontrada.");
  await assertBranchOwnership(supabase, zone.branch_id, restaurant.id);

  const { error } = await supabase.from("zones").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function reorderZones(branchId: string, orderedIds: string[]) {
  const { supabase, restaurant } = await getRestaurant();
  await assertBranchOwnership(supabase, branchId, restaurant.id);

  const updates = orderedIds.map((zoneId, index) =>
    supabase
      .from("zones")
      .update({ sort_order: index })
      .eq("id", zoneId)
      .eq("branch_id", branchId)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}
