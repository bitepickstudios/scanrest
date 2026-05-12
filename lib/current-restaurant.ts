import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const CURRENT_RESTAURANT_COOKIE = "current_restaurant_id";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 90,
};

export async function listOwnedRestaurants() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url, mode")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  return { user, restaurants: data ?? [] };
}

// URL-driven: read slug from route params. Validates ownership + syncs cookie
// so server actions invoked from this page hit the right restaurant.
export async function getRestaurantBySlug<S extends string = "*">(
  slug: string,
  select: S = "*" as S
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(select)
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/select-restaurant");

  return { supabase, user, restaurant: restaurant as any };
}

// Cookie-driven: used by server actions where URL params aren't available.
// Cookie is kept fresh by getRestaurantBySlug on every page render.
export async function getCurrentRestaurant<S extends string = "*">(
  select: S = "*" as S
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const cookieStore = await cookies();
  const cookieId = cookieStore.get(CURRENT_RESTAURANT_COOKIE)?.value ?? null;
  if (!cookieId) redirect("/auth/select-restaurant");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(select)
    .eq("id", cookieId)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/select-restaurant");

  return { supabase, user, restaurant: restaurant as any };
}
