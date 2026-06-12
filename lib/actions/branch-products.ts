"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";

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

export async function setProductAvailability(
  branchId: string,
  productId: string,
  available: boolean
) {
  const { supabase, restaurant } = await getRestaurant();
  await assertBranchOwnership(supabase, branchId, restaurant.id);

  const { error } = await supabase
    .from("branch_products")
    .upsert(
      { branch_id: branchId, product_id: productId, available },
      { onConflict: "branch_id,product_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function setProductPriceOverride(
  branchId: string,
  productId: string,
  priceOverride: number | null
) {
  const { supabase, restaurant } = await getRestaurant();
  await assertBranchOwnership(supabase, branchId, restaurant.id);

  const { error } = await supabase
    .from("branch_products")
    .upsert(
      { branch_id: branchId, product_id: productId, price_override: priceOverride },
      { onConflict: "branch_id,product_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function setProductBranchAvailability(
  productId: string,
  availableBranchIds: string[]
) {
  const { supabase, restaurant } = await getRestaurant();

  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id)
    .single();
  if (prodErr || !product) throw new Error("Producto no encontrado o sin acceso.");

  const { data: branches, error: brErr } = await supabase
    .from("branches")
    .select("id")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true);
  if (brErr) throw new Error(brErr.message);
  if (!branches || branches.length === 0) return;

  const availableSet = new Set(availableBranchIds);
  const rows = branches.map((b) => ({
    branch_id: b.id,
    product_id: productId,
    available: availableSet.has(b.id),
  }));

  const { error } = await supabase
    .from("branch_products")
    .upsert(rows, { onConflict: "branch_id,product_id" });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function bulkUpdateOverrides(
  branchId: string,
  items: Array<{ productId: string; available?: boolean; priceOverride?: number | null }>
) {
  const { supabase, restaurant } = await getRestaurant();
  await assertBranchOwnership(supabase, branchId, restaurant.id);

  if (items.length === 0) return;

  const rows = items.map((item) => {
    const row: {
      branch_id: string;
      product_id: string;
      available?: boolean;
      price_override?: number | null;
    } = {
      branch_id: branchId,
      product_id: item.productId,
    };

    if (item.available !== undefined) row.available = item.available;
    if (item.priceOverride !== undefined) row.price_override = item.priceOverride;

    return row;
  });

  const { error } = await supabase
    .from("branch_products")
    .upsert(rows, { onConflict: "branch_id,product_id" });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}
