"use server";

import { revalidatePath } from "next/cache";
import { getCurrentRestaurant } from "@/lib/current-restaurant";

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
