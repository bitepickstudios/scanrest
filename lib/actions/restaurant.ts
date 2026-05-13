"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  CURRENT_RESTAURANT_COOKIE,
  getCurrentRestaurant,
} from "@/lib/current-restaurant";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createRestaurant(input: {
  name: string;
  slug?: string;
  mode: string;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
}): Promise<{ slug: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const name = input.name?.trim();
  if (!name) throw new Error("El nombre es obligatorio.");
  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(name);
  if (!slug) throw new Error("Slug inválido.");
  if (!["table", "foodcourt"].includes(input.mode)) {
    throw new Error("Modo inválido.");
  }

  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    throw new Error("Ese slug ya está en uso. Probá otro.");
  }

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name,
      slug,
      mode: input.mode,
      whatsapp: input.whatsapp?.trim() || null,
      instagram: input.instagram?.trim() || null,
      facebook: input.facebook?.trim() || null,
      tiktok: input.tiktok?.trim() || null,
    })
    .select("id, slug")
    .single();

  if (error || !restaurant) throw new Error(error?.message ?? "Error al crear.");

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_RESTAURANT_COOKIE, restaurant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return { slug: restaurant.slug };
}

export async function updateRestaurantProfile(formData: FormData) {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");

  const fields = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: formData.get("description") as string,
    phone: formData.get("phone") as string,
    whatsapp: formData.get("whatsapp") as string,
    email: formData.get("email") as string,
    instagram: formData.get("instagram") as string,
    facebook: formData.get("facebook") as string,
    tiktok: formData.get("tiktok") as string,
    address: formData.get("address") as string,
    mode: formData.get("mode") as string,
    logo_url: (formData.get("logo_url") as string) || null,
    cover_url: (formData.get("cover_url") as string) || null,
  };

  const { error } = await supabase
    .from("restaurants")
    .update(fields)
    .eq("id", restaurant.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/${fields.slug}/profile`);
  revalidatePath(`/admin/${restaurant.slug}/profile`);
}

export async function updateRestaurantImage(
  field: "logo_url" | "cover_url",
  url: string
) {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");

  const { error } = await supabase
    .from("restaurants")
    .update({ [field]: url })
    .eq("id", restaurant.id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/${restaurant.slug}/profile`);
}
