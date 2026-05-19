"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function ensureTableSession({
  restaurantId,
  branchId,
  tableId,
  customerName,
  openedByStaffId,
  partySize,
}: {
  restaurantId: string;
  branchId: string;
  tableId: string;
  customerName: string;
  openedByStaffId?: string | null;
  partySize?: number | null;
}): Promise<string> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_id", tableId)
    .neq("status", "closed")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({
      restaurant_id: restaurantId,
      branch_id: branchId,
      table_id: tableId,
      customer_name: customerName,
      status: "open",
      opened_by_staff_id: openedByStaffId ?? null,
      party_size: partySize ?? null,
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "session create failed");
  return created.id as string;
}

export async function openTableSessionAsWaiter({
  branchId,
  tableId,
  customerName,
  partySize,
}: {
  branchId: string;
  tableId: string;
  customerName: string;
  partySize?: number | null;
}): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: branch } = await supabase
    .from("branches")
    .select("id, restaurant_id, active")
    .eq("id", branchId)
    .single();
  if (!branch?.active) throw new Error("Sucursal inválida.");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("restaurant_id", branch.restaurant_id)
    .eq("active", true)
    .maybeSingle();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("owner_id")
    .eq("id", branch.restaurant_id)
    .single();

  const isOwner = restaurant?.owner_id === user.id;
  if (!isOwner) {
    if (!staffRow) throw new Error("Sin permiso.");
    const allowed = new Set(["superadmin", "admin", "waiter"]);
    if (!allowed.has(staffRow.role)) throw new Error("Rol insuficiente.");
  }

  const { data: existing } = await supabase
    .from("table_sessions")
    .select("id")
    .eq("table_id", tableId)
    .neq("status", "closed")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("table_sessions")
    .insert({
      restaurant_id: branch.restaurant_id,
      branch_id: branchId,
      table_id: tableId,
      customer_name: customerName,
      status: "open",
      opened_by_staff_id: staffRow?.id ?? null,
      party_size: partySize ?? null,
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Error al abrir mesa.");
  return created.id;
}

export async function requestBill(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("table_sessions")
    .update({ bill_requested_at: new Date().toISOString(), status: "billing" })
    .eq("id", sessionId)
    .eq("status", "open");
  if (error) throw new Error(error.message);
}

export async function closeTableSession(sessionId: string, restaurantSlug: string, branchSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("table_sessions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurantSlug}/${branchSlug}/sessions`);
  revalidatePath(`/admin/${restaurantSlug}/${branchSlug}`);
}

export async function markSessionBilling(sessionId: string, restaurantSlug: string, branchSlug: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("table_sessions")
    .update({ status: "billing" })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurantSlug}/${branchSlug}/sessions`);
}
