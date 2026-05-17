import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReservationForm from "@/components/storefront/ReservationForm";

export const dynamic = "force-dynamic";

export default async function ReservasPage({
  params,
}: {
  params: Promise<{ slug: string; branchSlug: string }>;
}) {
  const { slug, branchSlug } = await params;
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  if (!restaurant) notFound();

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, address, phone")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", branchSlug)
    .eq("active", true)
    .single();
  if (!branch) notFound();

  const { data: zones } = await supabase
    .from("zones")
    .select("id, name")
    .eq("branch_id", branch.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-5 py-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Reservar mesa
        </p>
        <h1 className="text-lg font-semibold text-neutral-900">
          {restaurant.name} · {branch.name}
        </h1>
        {branch.address && (
          <p className="mt-1 text-xs text-neutral-500">{branch.address}</p>
        )}
      </header>
      <main className="mx-auto max-w-md px-5 py-6">
        <ReservationForm branchId={branch.id} zones={zones ?? []} />
      </main>
    </div>
  );
}
