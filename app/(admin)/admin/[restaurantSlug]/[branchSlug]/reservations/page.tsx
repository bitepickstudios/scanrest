import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import ReservationsBoard from "@/components/admin/ReservationsBoard";

export const dynamic = "force-dynamic";

export default async function ReservationsPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const { supabase, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const [resRes, tablesRes] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        "id, customer_name, customer_phone, customer_email, party_size, reservation_at, duration_minutes, status, zone_id, table_id, notes"
      )
      .eq("branch_id", branch.id)
      .in("status", ["pending", "confirmed", "seated", "completed"])
      .order("reservation_at", { ascending: true }),
    supabase
      .from("tables")
      .select("id, label, capacity")
      .eq("branch_id", branch.id)
      .eq("active", true)
      .order("number", { ascending: true }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-800">Reservas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {branch.name} — pendientes, confirmadas, en curso y completadas.
        </p>
      </div>
      <ReservationsBoard
        reservations={resRes.data ?? []}
        tables={tablesRes.data ?? []}
      />
    </div>
  );
}
