import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const CURRENT_RESTAURANT_COOKIE = "current_restaurant_id";
export const CURRENT_BRANCH_COOKIE = "current_branch_id";

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

export async function listBranchesForRestaurant(restaurantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, slug, name, is_default, active, type, address")
    .eq("restaurant_id", restaurantId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getRestaurantWithBranch(
  restaurantSlug: string,
  branchSlug: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", restaurantSlug)
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/select-restaurant");

  const { data: branch } = await supabase
    .from("branches")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .eq("slug", branchSlug)
    .single();

  if (!branch) redirect(`/admin/${restaurant.slug}`);

  return { supabase, user, restaurant, branch };
}

export async function getDefaultBranch(restaurantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("branches")
    .select("id, slug, name")
    .eq("restaurant_id", restaurantId)
    .eq("active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  return data;
}

export async function getCurrentStaffRole(restaurantId: string, branchId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("owner_id")
    .eq("id", restaurantId)
    .single();
  if (restaurant?.owner_id === user.id) return "superadmin" as const;

  let q = supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .eq("restaurant_id", restaurantId)
    .eq("active", true);
  if (branchId) q = q.eq("branch_id", branchId);
  const { data } = await q.maybeSingle();
  return (data?.role ?? null) as "superadmin" | "admin" | "waiter" | null;
}
