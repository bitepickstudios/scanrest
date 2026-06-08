"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

type StaffRole = Database["public"]["Enums"]["staff_role"];

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

async function assertStaffOwnership(
  supabase: Awaited<ReturnType<typeof getRestaurant>>["supabase"],
  staffId: string,
  restaurantId: string
) {
  const { data, error } = await supabase
    .from("staff")
    .select("id, branch_id")
    .eq("id", staffId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (error || !data) throw new Error("Miembro del staff no encontrado o sin acceso.");
  return data as { id: string; branch_id: string | null };
}

export async function createStaffAccount(input: {
  email: string;
  password: string;
  role: StaffRole;
  branchId?: string | null;
  displayName?: string | null;
  zoneIds?: string[];
}) {
  const { supabase, restaurant } = await getRestaurant();

  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";
  if (!email) throw new Error("Email obligatorio.");
  if (password.length < 6) throw new Error("Contraseña mínima 6 caracteres.");

  if (input.branchId) {
    await assertBranchOwnership(supabase, input.branchId, restaurant.id);
  }

  const admin = createAdminClient();

  // Find existing auth user by email (reuse across restaurants).
  let userId: string | null = null;
  let createdNewUser = false;

  const { data: pageOne, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);
  const existingUser = pageOne.users.find(
    (u) => u.email?.toLowerCase() === email
  );

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: input.displayName ? { display_name: input.displayName } : undefined,
    });
    if (createErr) throw new Error(createErr.message);
    if (!created.user) throw new Error("No se pudo crear el usuario.");
    userId = created.user.id;
    createdNewUser = true;
  }

  // Prevent duplicate staff row for this restaurant.
  const { data: dup } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (dup) {
    if (createdNewUser) {
      await admin.auth.admin.deleteUser(userId);
    }
    throw new Error("Este usuario ya es miembro del staff de este restaurante.");
  }

  const { data: newStaff, error } = await supabase
    .from("staff")
    .insert({
      user_id: userId,
      restaurant_id: restaurant.id,
      role: input.role,
      branch_id: input.branchId ?? null,
      display_name: input.displayName ?? null,
      active: true,
    })
    .select("id")
    .single();

  if (error) {
    if (createdNewUser) {
      await admin.auth.admin.deleteUser(userId);
    }
    throw new Error(error.message);
  }

  if (input.zoneIds && input.zoneIds.length > 0) {
    if (!input.branchId) {
      throw new Error("Se requiere branchId para asignar zonas.");
    }

    const { data: validZones, error: zonesError } = await supabase
      .from("zones")
      .select("id")
      .eq("branch_id", input.branchId)
      .in("id", input.zoneIds);

    if (zonesError) throw new Error(zonesError.message);
    if (!validZones || validZones.length !== input.zoneIds.length) {
      throw new Error("Una o más zonas no pertenecen a la sucursal indicada.");
    }

    const staffZoneRows = input.zoneIds.map((zoneId) => ({
      staff_id: newStaff.id,
      zone_id: zoneId,
    }));

    const { error: szError } = await supabase.from("staff_zones").insert(staffZoneRows);
    if (szError) throw new Error(szError.message);
  }

  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function updateStaffRole(staffId: string, role: StaffRole) {
  const { supabase, restaurant } = await getRestaurant();

  await assertStaffOwnership(supabase, staffId, restaurant.id);

  const { error } = await supabase
    .from("staff")
    .update({ role })
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function deactivateStaff(staffId: string) {
  const { supabase, restaurant } = await getRestaurant();

  await assertStaffOwnership(supabase, staffId, restaurant.id);

  const { error } = await supabase
    .from("staff")
    .update({ active: false })
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function deleteStaff(staffId: string) {
  const { supabase, restaurant } = await getRestaurant();

  await assertStaffOwnership(supabase, staffId, restaurant.id);

  await supabase.from("staff_zones").delete().eq("staff_id", staffId);

  const { error } = await supabase
    .from("staff")
    .delete()
    .eq("id", staffId)
    .eq("restaurant_id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

export async function assignZones(staffId: string, zoneIds: string[]) {
  const { supabase, restaurant } = await getRestaurant();

  const staffRow = await assertStaffOwnership(supabase, staffId, restaurant.id);

  if (!staffRow.branch_id) {
    throw new Error("El staff no tiene sucursal asignada; no se pueden asignar zonas.");
  }

  if (zoneIds.length > 0) {
    // Validate all zones belong to the staff member's branch.
    const { data: validZones, error: zonesError } = await supabase
      .from("zones")
      .select("id")
      .eq("branch_id", staffRow.branch_id)
      .in("id", zoneIds);

    if (zonesError) throw new Error(zonesError.message);
    if (!validZones || validZones.length !== zoneIds.length) {
      throw new Error("Una o más zonas no pertenecen a la sucursal del staff.");
    }
  }

  // Replace: delete all existing assignments then insert new ones.
  const { error: deleteError } = await supabase
    .from("staff_zones")
    .delete()
    .eq("staff_id", staffId);

  if (deleteError) throw new Error(deleteError.message);

  if (zoneIds.length > 0) {
    const rows = zoneIds.map((zoneId) => ({ staff_id: staffId, zone_id: zoneId }));
    const { error: insertError } = await supabase.from("staff_zones").insert(rows);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}
