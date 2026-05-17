"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RestaurantMode } from "@/lib/types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

interface WaiterOrderModifier {
  name: string;
  priceDelta: number;
}

interface WaiterOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
  modifiers?: WaiterOrderModifier[];
}

export interface CreateWaiterOrderInput {
  branchId: string;
  tableId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerCi?: string | null;
  notes?: string | null;
  wantsInvoice?: boolean;
  ruc?: string | null;
  razonSocial?: string | null;
  items: WaiterOrderItem[];
}

export interface CreateWaiterOrderResult {
  orderId: string;
  orderNumber: number;
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

export async function createWaiterOrder(
  input: CreateWaiterOrderInput
): Promise<CreateWaiterOrderResult> {
  const supabase = await createClient();

  // 1. Authenticate caller.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  // 2. Validate input basics.
  if (!input.branchId) throw new Error("branchId es obligatorio.");
  if (!input.customerName?.trim()) throw new Error("Nombre del cliente es obligatorio.");
  if (!input.items || input.items.length === 0)
    throw new Error("El pedido debe tener al menos un ítem.");

  // 3. Fetch branch and derive restaurant — do NOT rely on cookie.
  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id, restaurant_id, active")
    .eq("id", input.branchId)
    .single();

  if (branchError || !branch) throw new Error("Sucursal no encontrada.");
  if (!branch.active) throw new Error("La sucursal no está activa.");

  const restaurantId = branch.restaurant_id;

  // 4. Fetch restaurant for slug (revalidate) and mode.
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, slug, mode, owner_id")
    .eq("id", restaurantId)
    .single();

  if (restaurantError || !restaurant) throw new Error("Restaurante no encontrado.");

  // 5. Authorize: owner always allowed; otherwise require staff row.
  const isOwner = restaurant.owner_id === user.id;

  let staffId: string | null = null;

  if (isOwner) {
    // Owners may or may not have a staff row — staffId stays null unless found.
    const { data: ownerStaff } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .maybeSingle();
    staffId = ownerStaff?.id ?? null;
  } else {
    // Must have an active staff row with admin or waiter role for this restaurant.
    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .maybeSingle();

    if (staffError || !staffRow)
      throw new Error("No tenés permiso para crear pedidos en este restaurante.");

    const allowed: string[] = ["superadmin", "admin", "waiter"];
    if (!allowed.includes(staffRow.role))
      throw new Error("Rol insuficiente para crear pedidos.");

    staffId = staffRow.id;
  }

  // 6. Validate tableId belongs to this branch (if provided).
  if (input.tableId) {
    const { data: tableRow, error: tableError } = await supabase
      .from("tables")
      .select("id")
      .eq("id", input.tableId)
      .eq("branch_id", input.branchId)
      .single();

    if (tableError || !tableRow)
      throw new Error("Mesa no encontrada en esta sucursal.");
  }

  // 7. Insert order.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      branch_id: input.branchId,
      table_id: input.tableId ?? null,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone?.trim() ?? null,
      customer_ci: input.customerCi?.trim() ?? null,
      mode: restaurant.mode as RestaurantMode,
      notes: input.notes?.trim() ?? null,
      source: "waiter",
      waiter_id: staffId,
      wants_invoice: input.wantsInvoice ?? false,
      ruc: input.ruc?.trim() ?? null,
      razon_social: input.razonSocial?.trim() ?? null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Error al crear el pedido.");

  // 8. Insert order_items.
  const orderItemRows = input.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    notes: item.notes?.trim() ?? null,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemRows)
    .select("id");

  if (itemsError || !insertedItems)
    throw new Error(itemsError?.message ?? "Error al guardar los ítems del pedido.");

  // 9. Insert order_item_modifiers for items that have them.
  const modifierRows = input.items.flatMap((item, idx) => {
    if (!item.modifiers || item.modifiers.length === 0) return [];
    return item.modifiers.map((mod) => ({
      order_item_id: insertedItems[idx].id,
      modifier_name: mod.name,
      price_delta: mod.priceDelta,
    }));
  });

  if (modifierRows.length > 0) {
    const { error: modError } = await supabase
      .from("order_item_modifiers")
      .insert(modifierRows);
    if (modError) throw new Error(modError.message);
  }

  revalidatePath(`/admin/${restaurant.slug}`, "layout");

  return { orderId: order.id, orderNumber: order.order_number };
}
