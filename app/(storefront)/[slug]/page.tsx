import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import MenuSection from "@/components/storefront/MenuSection";
import CartButton from "@/components/storefront/CartButton";
import ActiveOrderBanner from "@/components/storefront/ActiveOrderBanner";

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table: tableId } = await searchParams;

  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!restaurant) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select(`*, products(*, modifier_groups(*, modifiers(*)))`)
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  const { data: table } = tableId
    ? await supabase
        .from("tables")
        .select("number, label")
        .eq("id", tableId)
        .eq("restaurant_id", restaurant.id)
        .single()
    : { data: null };

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("restaurant_id", restaurant.id);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <StorefrontHeader
        restaurant={restaurant}
        avgRating={avgRating}
        reviewCount={reviews?.length ?? 0}
      />
      {table && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/10 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-bold">
              {table.number}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Estás en</p>
              <p className="text-sm font-bold text-[var(--foreground)] truncate">
                {table.label || `Mesa ${table.number}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <MenuSection
        categories={(categories ?? []) as any}
        restaurantId={restaurant.id}
        restaurantSlug={slug}
        tableId={tableId ?? null}
        mode={restaurant.mode}
      />
      <ActiveOrderBanner slug={slug} />
      <CartButton
        restaurantSlug={slug}
        tableId={tableId ?? null}
        mode={restaurant.mode}
        table={table}
      />
    </div>
  );
}
