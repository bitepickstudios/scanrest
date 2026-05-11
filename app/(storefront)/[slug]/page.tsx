import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import MenuSection from "@/components/storefront/MenuSection";
import CartButton from "@/components/storefront/CartButton";

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
      <MenuSection
        categories={(categories ?? []) as any}
        restaurantId={restaurant.id}
        restaurantSlug={slug}
        tableId={tableId ?? null}
        mode={restaurant.mode}
      />
      <CartButton
        restaurantSlug={slug}
        tableId={tableId ?? null}
        mode={restaurant.mode}
      />
    </div>
  );
}
