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
