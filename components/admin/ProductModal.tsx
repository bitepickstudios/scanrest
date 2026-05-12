"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Button } from "@heroui/react";
import { createProduct, updateProduct } from "@/lib/actions/menu";
import { createClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/lib/types";

export default function ProductModal({
  restaurantId,
  categories,
  categoryId,
  product,
  onClose,
}: {
  restaurantId: string;
  categories: Category[];
  categoryId: string;
  product: Product | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File): Promise<string | null> {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${restaurantId}/products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });
    if (error) { setError(error.message); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setImageUrl(url);
    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const data = {
      category_id: fd.get("category_id") as string || null,
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      price: parseFloat(fd.get("price") as string),
      image_url: imageUrl || null,
    };
    startTransition(async () => {
      try {
        if (product) {
          await updateProduct(product.id, { ...data, available: product.available });
        } else {
          await createProduct(data);
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100";
  const labelClass = "mb-1 block text-xs font-medium text-neutral-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[modal-backdrop_0.18s_ease-out]">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-base font-semibold">
            {product ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className={labelClass}>Categoría</label>
            <select name="category_id" defaultValue={product?.category_id ?? categoryId} className={inputClass}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="p-name">Nombre *</label>
            <input id="p-name" name="name" required defaultValue={product?.name} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="p-desc">Descripción</label>
            <textarea id="p-desc" name="description" rows={2} defaultValue={product?.description ?? ""} className={inputClass} />
          </div>

          <div>
            <label className={labelClass} htmlFor="p-price">Precio (Gs.) *</label>
            <input id="p-price" name="price" type="number" required min={0} step={500} defaultValue={product?.price} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Imagen</label>
            {imageUrl && (
              <img src={imageUrl} alt="preview" className="mb-2 h-24 w-full rounded-lg object-cover" />
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} className="text-sm text-neutral-500" />
            {uploading && <p className="mt-1 text-xs text-neutral-400">Subiendo...</p>}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onPress={onClose}>Cancelar</Button>
            <Button variant="primary" type="submit" isDisabled={isPending || uploading}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
