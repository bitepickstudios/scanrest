"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Radio,
  RadioGroup,
  TextArea,
  TextField,
} from "@heroui/react";
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
  const [name, setName] = useState(restaurant.name);
  const [slug, setSlug] = useState(restaurant.slug);
  const [slugEdited, setSlugEdited] = useState(true);

  function slugifyLocal(s: string) {
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugifyLocal(v));
  }

  function handleSlugChange(v: string) {
    setSlug(v);
    setSlugEdited(true);
  }
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover */}
      <div className="flex flex-col gap-2">
        <Label>Imagen de portada</Label>
        {coverUrl && (
          <img
            src={coverUrl}
            alt="Cover"
            className="h-32 w-full rounded-lg object-cover"
          />
        )}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, "cover_url")}
          className="hidden"
          disabled={uploading !== null}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onPress={() => coverInputRef.current?.click()}
          isDisabled={uploading !== null}
          className="w-fit"
        >
          <Upload size={14} />
          {uploading === "cover"
            ? "Subiendo..."
            : coverUrl
              ? "Cambiar portada"
              : "Subir portada"}
        </Button>
      </div>

      {/* Logo */}
      <div className="flex flex-col gap-2">
        <Label>Logo</Label>
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Logo"
            className="h-20 w-20 rounded-full object-cover"
          />
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e, "logo_url")}
          className="hidden"
          disabled={uploading !== null}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onPress={() => logoInputRef.current?.click()}
          isDisabled={uploading !== null}
          className="w-fit"
        >
          <Upload size={14} />
          {uploading === "logo"
            ? "Subiendo..."
            : logoUrl
              ? "Cambiar logo"
              : "Subir logo"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          isRequired
          name="name"
          value={name}
          onChange={handleNameChange}
          className="w-full"
        >
          <Label>Nombre del restaurante</Label>
          <Input />
        </TextField>
        <TextField
          isRequired
          name="slug"
          value={slug}
          onChange={handleSlugChange}
          className="w-full"
        >
          <Label>Slug (URL)</Label>
          <Input pattern="[a-z0-9\-]+" />
          <p className="mt-1 text-xs text-neutral-400">
            Solo minúsculas, números y guiones
          </p>
        </TextField>
      </div>

      <TextField
        name="description"
        defaultValue={restaurant.description ?? ""}
        className="w-full"
      >
        <Label>Descripción</Label>
        <TextArea rows={3} />
      </TextField>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          name="phone"
          defaultValue={restaurant.phone ?? ""}
          className="w-full"
        >
          <Label>Teléfono</Label>
          <Input />
        </TextField>
        <TextField
          name="whatsapp"
          defaultValue={restaurant.whatsapp ?? ""}
          className="w-full"
        >
          <Label>WhatsApp</Label>
          <Input placeholder="+595 9XX XXXXXX" />
        </TextField>
        <TextField
          name="email"
          type="email"
          defaultValue={restaurant.email ?? ""}
          className="w-full"
        >
          <Label>Email</Label>
          <Input />
        </TextField>
        <TextField
          name="address"
          defaultValue={restaurant.address ?? ""}
          className="w-full"
        >
          <Label>Dirección</Label>
          <Input />
        </TextField>
        <TextField
          name="instagram"
          defaultValue={restaurant.instagram ?? ""}
          className="w-full"
        >
          <Label>Instagram</Label>
          <Input placeholder="@usuario" />
        </TextField>
        <TextField
          name="facebook"
          defaultValue={restaurant.facebook ?? ""}
          className="w-full"
        >
          <Label>Facebook</Label>
          <Input placeholder="facebook.com/pagina" />
        </TextField>
        <TextField
          name="tiktok"
          defaultValue={restaurant.tiktok ?? ""}
          className="w-full"
        >
          <Label>TikTok</Label>
          <Input placeholder="@usuario" />
        </TextField>
      </div>

      <RadioGroup
        name="mode"
        defaultValue={restaurant.mode ?? "table"}
        orientation="horizontal"
      >
        <Label>Modo de operación</Label>
        <Radio value="table">
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content>
            <Label>Restaurante con mesas</Label>
          </Radio.Content>
        </Radio>
        <Radio value="foodcourt">
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          <Radio.Content>
            <Label>Food court (retiro en mostrador)</Label>
          </Radio.Content>
        </Radio>
      </RadioGroup>

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

      <Button
        type="submit"
        variant="primary"
        size="md"
        isPending={isPending}
        isDisabled={isPending || uploading !== null}
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
