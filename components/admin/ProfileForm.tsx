"use client";

import { useState, useTransition } from "react";
import { updateRestaurantProfile } from "@/lib/actions/restaurant";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/lib/types";

export default function ProfileForm({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url ?? "");
  const [coverUrl, setCoverUrl] = useState(restaurant.cover_url ?? "");

  async function uploadImage(
    file: File,
    field: "logo_url" | "cover_url"
  ): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${restaurant.id}/${field}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("restaurant-images")
      .upload(path, file, { upsert: true });

    if (error) {
      setError(error.message);
      return null;
    }

    const { data } = supabase.storage
      .from("restaurant-images")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "logo_url" | "cover_url"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field === "logo_url" ? "logo" : "cover");
    const url = await uploadImage(file, field);
    if (url) {
      if (field === "logo_url") setLogoUrl(url);
      else setCoverUrl(url);
    }
    setUploading(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("logo_url", logoUrl);
    data.set("cover_url", coverUrl);

    startTransition(async () => {
      try {
        await updateRestaurantProfile(data);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100";
  const labelClass = "mb-1 block text-sm font-medium text-neutral-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover */}
      <div>
        <label className={labelClass}>Imagen de portada</label>
        {coverUrl && (
          <img
            src={coverUrl}
            alt="Cover"
            className="mb-2 h-32 w-full rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, "cover_url")}
          className="text-sm text-neutral-500"
          disabled={uploading !== null}
        />
        {uploading === "cover" && (
          <p className="mt-1 text-xs text-neutral-400">Subiendo...</p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label className={labelClass}>Logo</label>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="mb-2 h-20 w-20 rounded-full object-cover"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, "logo_url")}
          className="text-sm text-neutral-500"
          disabled={uploading !== null}
        />
        {uploading === "logo" && (
          <p className="mt-1 text-xs text-neutral-400">Subiendo...</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="name">
            Nombre del restaurante *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={restaurant.name}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="slug">
            Slug (URL) *
          </label>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={restaurant.slug}
            pattern="[a-z0-9\-]+"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-neutral-400">
            Solo minúsculas, números y guiones
          </p>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="description">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={restaurant.description ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="phone">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={restaurant.phone ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="whatsapp">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            defaultValue={restaurant.whatsapp ?? ""}
            placeholder="+595 9XX XXXXXX"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={restaurant.email ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="address">
            Dirección
          </label>
          <input
            id="address"
            name="address"
            defaultValue={restaurant.address ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="instagram">
            Instagram
          </label>
          <input
            id="instagram"
            name="instagram"
            defaultValue={restaurant.instagram ?? ""}
            placeholder="@usuario"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="facebook">
            Facebook
          </label>
          <input
            id="facebook"
            name="facebook"
            defaultValue={restaurant.facebook ?? ""}
            placeholder="facebook.com/pagina"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Modo de operación</label>
        <div className="flex gap-4">
          {[
            { value: "table", label: "Restaurante con mesas" },
            { value: "foodcourt", label: "Food court (retiro en mostrador)" },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name="mode"
                value={value}
                defaultChecked={restaurant.mode === value}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
          Guardado correctamente
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || uploading !== null}
        className="rounded-lg bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
