import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MenuManager from "@/components/admin/MenuManager";

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/register");

  const { data: categories } = await supabase
    .from("categories")
    .select(
      `*, products(*, modifier_groups(*, modifiers(*)))`
    )
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 bg-white px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">Menú</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Gestioná categorías, productos y modificadores.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MenuManager
          restaurantId={restaurant.id}
          categories={(categories ?? []) as any}
        />
      </div>
    </div>
  );
}
