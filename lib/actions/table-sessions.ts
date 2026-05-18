"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function ensureTableSession({
  restaurantId,
  branchId,
  tableId,
  customerName,
}: {
  restaurantId: string;
  branchId: string;
  tableId: string;
  customerName: string;
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
    })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "session create failed");
  return created.id as string;
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
