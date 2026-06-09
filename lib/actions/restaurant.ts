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

export async function createRestaurantWithDefaultBranch(input: {
  name: string;
  slug?: string;
  description?: string | null;
  mode: "table" | "foodcourt";
  phone?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
}): Promise<{ restaurantSlug: string; branchSlug: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const name = input.name?.trim();
  if (!name) throw new Error("El nombre es obligatorio.");
  if (!["table", "foodcourt"].includes(input.mode)) {
    throw new Error("Modo inválido.");
  }

  const baseSlug = input.slug?.trim() ? slugify(input.slug) : slugify(name);
  if (!baseSlug) throw new Error("Slug inválido.");

  // Retry slug with -2, -3, ... if collision
  let finalSlug = baseSlug;
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!existing) {
      finalSlug = candidate;
      break;
    }
    if (attempt === 9) {
      throw new Error("No se pudo generar un slug único. Probá otro nombre.");
    }
  }

  const { data: restaurant, error: restErr } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name,
      slug: finalSlug,
      description: input.description?.trim() || null,
      mode: input.mode,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      instagram: input.instagram?.trim() || null,
      facebook: input.facebook?.trim() || null,
      tiktok: input.tiktok?.trim() || null,
    })
    .select("id, slug")
    .single();

  if (restErr || !restaurant) {
    throw new Error(restErr?.message ?? "Error al crear restaurante.");
  }

  const branchType =
    input.mode === "foodcourt" ? "foodpark_stall" : "standalone";

  const { data: branch, error: branchErr } = await supabase
    .from("branches")
    .insert({
      restaurant_id: restaurant.id,
      name: "Principal",
      slug: "principal",
      type: branchType,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      is_default: true,
      active: true,
    })
    .select("slug")
    .single();

  if (branchErr || !branch) {
    throw new Error(branchErr?.message ?? "Error al crear sucursal.");
  }

  const cookieStore = await cookies();
  cookieStore.set(CURRENT_RESTAURANT_COOKIE, restaurant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  revalidatePath(`/admin/${restaurant.slug}`);
  return { restaurantSlug: restaurant.slug, branchSlug: branch.slug };
}

export async function updateRestaurantProfile(formData: FormData) {
  const { supabase, restaurant } = await getCurrentRestaurant("id, slug");

  const allowed = [
    "name",
    "slug",
    "description",
    "phone",
    "whatsapp",
    "email",
    "instagram",
    "facebook",
    "tiktok",
    "address",
    "mode",
    "logo_url",
    "cover_url",
    "theme",
    "menu_layout",
    "menu_rounded",
    "accent_color",
  ] as const;
  const nullableEmpty = new Set([
    "logo_url",
    "cover_url",
    "accent_color",
    "description",
    "phone",
    "whatsapp",
    "email",
    "instagram",
    "facebook",
    "tiktok",
    "address",
  ]);

  const fields: Record<string, string | null> = {};
  for (const key of allowed) {
    if (!formData.has(key)) continue;
    const value = (formData.get(key) as string) ?? "";
    fields[key] = value === "" && nullableEmpty.has(key) ? null : value;
  }

  if (Object.keys(fields).length === 0) return;

  const { error } = await supabase
    .from("restaurants")
    .update(fields)
    .eq("id", restaurant.id);

  if (error) throw new Error(error.message);

  const nextSlug = (fields.slug as string | undefined) ?? restaurant.slug;
  revalidatePath(`/admin/${nextSlug}/profile`);
  revalidatePath(`/admin/${restaurant.slug}/profile`);
  revalidatePath(`/${nextSlug}`, "layout");
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
