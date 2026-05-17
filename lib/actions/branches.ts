"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";
import type { Database } from "@/lib/database.types";

type BranchInsert = Database["public"]["Tables"]["branches"]["Insert"];
type BranchUpdate = Database["public"]["Tables"]["branches"]["Update"];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getRestaurant() {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");
  return { supabase, restaurant: restaurant as { id: string; slug: string } };
}

export async function createBranch(input: {
  name: string;
  slug?: string;
  address?: string | null;
  phone?: string | null;
  type?: Database["public"]["Enums"]["branch_type"];
  isDefault?: boolean;
}) {
  const { supabase, restaurant } = await getRestaurant();

  const name = input.name.trim();
  if (!name) throw new Error("El nombre es obligatorio.");

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(name);
  if (!slug) throw new Error("Slug inválido.");

  const { data: existing } = await supabase
    .from("branches")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", slug)
    .maybeSingle();

  if (existing) throw new Error("Ese slug ya está en uso en esta sucursal.");

  const row: BranchInsert = {
    restaurant_id: restaurant.id,
    slug,
    name,
    address: input.address ?? null,
    phone: input.phone ?? null,
    type: input.type ?? "standalone",
    is_default: input.isDefault ?? false,
  };

  if (input.isDefault) {
    const { error: unsetError } = await supabase
      .from("branches")
      .update({ is_default: false })
      .eq("restaurant_id", restaurant.id);
    if (unsetError) throw new Error(unsetError.message);
  }

  const { error } = await supabase.from("branches").insert(row);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function updateBranch(
  id: string,
  patch: Omit<BranchUpdate, "id" | "restaurant_id" | "created_at">
) {
  const { supabase, restaurant } = await getRestaurant();

  const { error } = await supabase
    .from("branches")
    .update(patch)
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function deleteBranch(id: string) {
  const { supabase, restaurant } = await getRestaurant();

  const { data: activeBranches, error: countError } = await supabase
    .from("branches")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true);

  if (countError) throw new Error(countError.message);
  if (!activeBranches || activeBranches.length <= 1) {
    throw new Error("No se puede eliminar la última sucursal activa.");
  }

  const { error } = await supabase
    .from("branches")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function setDefaultBranch(id: string) {
  const { supabase, restaurant } = await getRestaurant();

  const { error: unsetError } = await supabase
    .from("branches")
    .update({ is_default: false })
    .eq("restaurant_id", restaurant.id);

  if (unsetError) throw new Error(unsetError.message);

  const { error } = await supabase
    .from("branches")
    .update({ is_default: true })
    .eq("id", id)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}
