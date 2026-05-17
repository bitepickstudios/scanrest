"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReservationStatus } from "@/lib/database.types";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateReservationInput {
  branchId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  partySize: number;
  reservationAt: string; // ISO 8601
  durationMinutes?: number | null;
  zoneId?: string | null;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// Internal access helper
// ---------------------------------------------------------------------------

interface ReservationAccessContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  reservation: {
    id: string;
    branch_id: string;
    table_id: string | null;
    reservation_at: string;
    duration_minutes: number;
    status: ReservationStatus;
  };
  restaurant: { id: string; slug: string; owner_id: string };
  staffId: string | null;
}

async function assertReservationAccess(
  reservationId: string
): Promise<ReservationAccessContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  // Fetch reservation.
  const { data: reservation, error: resError } = await supabase
    .from("reservations")
    .select("id, branch_id, table_id, reservation_at, duration_minutes, status")
    .eq("id", reservationId)
    .single();

  if (resError || !reservation) throw new Error("Reserva no encontrada.");

  // Fetch branch to get restaurant_id.
  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("restaurant_id")
    .eq("id", reservation.branch_id)
    .single();

  if (branchError || !branch) throw new Error("Sucursal de la reserva no encontrada.");

  // Fetch restaurant.
  const { data: restaurant, error: restError } = await supabase
    .from("restaurants")
    .select("id, slug, owner_id")
    .eq("id", branch.restaurant_id)
    .single();

  if (restError || !restaurant) throw new Error("Restaurante no encontrado.");

  const isOwner = restaurant.owner_id === user.id;

  let staffId: string | null = null;

  if (isOwner) {
    // Owner always has access; find optional staff row.
    const { data: ownerStaff } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurant.id)
      .eq("active", true)
      .maybeSingle();
    staffId = ownerStaff?.id ?? null;
  } else {
    // Require active staff row with admin/waiter role.
    const { data: staffRow } = await supabase
      .from("staff")
      .select("id, role")
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurant.id)
      .eq("active", true)
      .maybeSingle();

    const allowed: string[] = ["superadmin", "admin", "waiter"];
    if (!staffRow || !allowed.includes(staffRow.role))
      throw new Error("No tenés permiso para gestionar reservas de este restaurante.");

    staffId = staffRow.id;
  }

  return { supabase, reservation, restaurant, staffId };
}

// ---------------------------------------------------------------------------
// Transition guard helpers
// ---------------------------------------------------------------------------

function assertStatus(
  current: ReservationStatus,
  allowed: ReservationStatus[],
  actionLabel: string
): void {
  if (!allowed.includes(current))
    throw new Error(`No se puede ${actionLabel} una reserva en estado "${current}".`);
}

// ---------------------------------------------------------------------------
// Public action: createReservation (no auth required)
// ---------------------------------------------------------------------------

export async function createReservation(
  input: CreateReservationInput
): Promise<{ reservationId: string }> {
  if (!input.branchId) throw new Error("branchId es obligatorio.");
  if (!input.customerName?.trim()) throw new Error("Nombre del cliente es obligatorio.");
  if (!input.customerPhone?.trim()) throw new Error("Teléfono del cliente es obligatorio.");
  if (!input.partySize || input.partySize < 1)
    throw new Error("El tamaño del grupo debe ser al menos 1.");
  if (!input.reservationAt) throw new Error("Fecha y hora de la reserva son obligatorias.");

  const supabase = await createClient();

  // Validate branch exists and is active.
  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id, active, restaurant_id")
    .eq("id", input.branchId)
    .single();

  if (branchError || !branch) throw new Error("Sucursal no encontrada.");
  if (!branch.active) throw new Error("La sucursal no está disponible para reservas.");

  const { data: reservation, error } = await supabase
    .from("reservations")
    .insert({
      branch_id: input.branchId,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      customer_email: input.customerEmail?.trim() ?? null,
      party_size: input.partySize,
      reservation_at: input.reservationAt,
      duration_minutes: input.durationMinutes ?? 90,
      zone_id: input.zoneId ?? null,
      notes: input.notes?.trim() ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !reservation) throw new Error(error?.message ?? "Error al crear la reserva.");

  return { reservationId: reservation.id };
}

// ---------------------------------------------------------------------------
// Staff action: approveReservation
// ---------------------------------------------------------------------------

export async function approveReservation(
  id: string,
  tableId?: string | null
): Promise<void> {
  const { supabase, reservation, restaurant, staffId } =
    await assertReservationAccess(id);

  assertStatus(reservation.status, ["pending"], "confirmar");

  // Validate table and check overlap if tableId provided.
  if (tableId) {
    const { data: tableRow, error: tableError } = await supabase
      .from("tables")
      .select("id")
      .eq("id", tableId)
      .eq("branch_id", reservation.branch_id)
      .single();

    if (tableError || !tableRow)
      throw new Error("Mesa no encontrada en esta sucursal.");

    // Overlap check: any confirmed/seated reservation for same table in the
    // same time window [reservation_at, reservation_at + duration_minutes].
    const resStart = reservation.reservation_at;
    const resEnd = new Date(
      new Date(resStart).getTime() + reservation.duration_minutes * 60_000
    ).toISOString();

    // Overlap condition: existing.start < resEnd AND existing.end > resStart
    // expressed as: reservation_at < resEnd AND (reservation_at + duration * interval) > resStart
    // We use a simple range via gte/lte guards — a reservation overlaps if:
    //   existing.reservation_at < resEnd  AND
    //   existing.reservation_at + duration > resStart
    // Fetching candidates and checking in JS is safe given typical reservation volumes.
    const { data: conflicts } = await supabase
      .from("reservations")
      .select("id, reservation_at, duration_minutes")
      .eq("table_id", tableId)
      .in("status", ["confirmed", "seated"])
      .neq("id", id)
      .lt("reservation_at", resEnd);

    const hasOverlap = (conflicts ?? []).some((c) => {
      const existingEnd = new Date(
        new Date(c.reservation_at).getTime() + c.duration_minutes * 60_000
      ).toISOString();
      return existingEnd > resStart;
    });

    if (hasOverlap)
      throw new Error(
        "La mesa ya tiene una reserva confirmada que se superpone con este horario."
      );
  }

  const { error } = await supabase
    .from("reservations")
    .update({
      status: "confirmed",
      table_id: tableId ?? reservation.table_id,
      approved_by: staffId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

// ---------------------------------------------------------------------------
// Staff action: rejectReservation
// ---------------------------------------------------------------------------

export async function rejectReservation(
  id: string,
  reason?: string | null
): Promise<void> {
  const { supabase, reservation, restaurant, staffId } =
    await assertReservationAccess(id);

  assertStatus(reservation.status, ["pending", "confirmed"], "rechazar");

  const patch: Record<string, unknown> = {
    status: "rejected",
    approved_by: staffId,
    approved_at: new Date().toISOString(),
  };

  if (reason?.trim()) {
    patch.notes = reason.trim();
  }

  const { error } = await supabase
    .from("reservations")
    .update(patch)
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

// ---------------------------------------------------------------------------
// Staff action: markSeated
// ---------------------------------------------------------------------------

export async function markSeated(id: string): Promise<void> {
  const { supabase, reservation, restaurant } =
    await assertReservationAccess(id);

  assertStatus(reservation.status, ["confirmed"], "marcar como sentada");

  if (!reservation.table_id)
    throw new Error("La reserva debe tener una mesa asignada antes de marcar como sentada.");

  const { error } = await supabase
    .from("reservations")
    .update({ status: "seated" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

// ---------------------------------------------------------------------------
// Staff action: markCompleted
// ---------------------------------------------------------------------------

export async function markCompleted(id: string): Promise<void> {
  const { supabase, reservation, restaurant } =
    await assertReservationAccess(id);

  assertStatus(reservation.status, ["seated", "confirmed"], "marcar como completada");

  const { error } = await supabase
    .from("reservations")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

// ---------------------------------------------------------------------------
// Staff action: markNoShow
// ---------------------------------------------------------------------------

export async function markNoShow(id: string): Promise<void> {
  const { supabase, reservation, restaurant } =
    await assertReservationAccess(id);

  assertStatus(reservation.status, ["confirmed", "seated"], "marcar como no-show");

  const { error } = await supabase
    .from("reservations")
    .update({ status: "no_show" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}

// ---------------------------------------------------------------------------
// Staff/public action: cancelReservation
// ---------------------------------------------------------------------------

export async function cancelReservation(id: string): Promise<void> {
  const { supabase, reservation, restaurant } =
    await assertReservationAccess(id);

  assertStatus(
    reservation.status,
    ["pending", "confirmed"],
    "cancelar"
  );

  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}`, "layout");
}
