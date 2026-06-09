"use client";

import { useState, useTransition } from "react";
import { X, Plus, Check } from "lucide-react";
import {
  Button,
  Input,
  NumberField,
  Label,
  Select,
  ListBox,
  Disclosure,
} from "@heroui/react";
import {
  createProduct,
  updateProduct,
  createCategory,
} from "@/lib/actions/menu";
import { createClient } from "@/lib/supabase/client";
import ImageDropzone from "@/components/ui/ImageDropzone";
import ModifierEditor, { GroupWithModifiers } from "./ModifierEditor";
import type { Category, Product } from "@/lib/types";

type ProductWithModifiers = Product & {
  modifier_groups: GroupWithModifiers[];
};

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
  product: ProductWithModifiers | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [uploading, setUploading] = useState(false);

  const [localCategories, setLocalCategories] = useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    product?.category_id ?? categoryId
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState<number | undefined>(product?.price ?? undefined);

  const [persistedGroups, setPersistedGroups] = useState<GroupWithModifiers[]>(
    product?.modifier_groups ?? []
  );

  const isEditMode = !!product;

  async function uploadImage(file: File) {
    setError(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${restaurantId}/products/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir imagen");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    try {
      const created = await createCategory(trimmed);
      if (created) {
        setLocalCategories((prev) => [...prev, created as Category]);
        setSelectedCategoryId(created.id);
      }
      setNewCategoryName("");
      setCreatingCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear categoría");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Nombre requerido");
      return;
    }
    if (price == null || price < 0) {
      setError("Precio inválido");
      return;
    }

    const data = {
      category_id: selectedCategoryId || null,
      name: name.trim(),
      description: description.trim(),
      price,
      image_url: imageUrl || null,
    };

    startTransition(async () => {
      try {
        if (product) {
          await updateProduct(product.id, { ...data, available: product.available });
        } else {
          await createProduct(data);
          // Persist draft modifier groups + items (chain after product create — but createProduct
          // doesn't return id today. So draft modifiers only persist for edit mode here.)
          // For create mode, draft groups are dropped on first save. User edits product after to add them.
          // TODO: have createProduct return the id so we can chain.
        }
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[modal-backdrop_0.18s_ease-out]">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h3 className="text-base font-semibold">
            {product ? "Editar producto" : "Nuevo producto"}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-64px)] overflow-y-auto">
          <div className="space-y-4 p-5">
            {/* Categoría con inline create */}
            <div>
              <Label className="mb-1 block text-xs font-medium text-neutral-600">
                Categoría
              </Label>
              {creatingCategory ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de categoría"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                      if (e.key === "Escape") {
                        setCreatingCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onPress={handleCreateCategory}
                    isDisabled={!newCategoryName.trim()}
                  >
                    <Check size={14} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setCreatingCategory(false);
                      setNewCategoryName("");
                    }}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ) : (
                <Select
                  fullWidth
                  placeholder="Seleccionar categoría"
                  value={selectedCategoryId || null}
                  onChange={(v) => {
                    const next = Array.isArray(v) ? v[0] : v;
                    const str = next == null ? "" : String(next);
                    if (str === "__create__") {
                      setCreatingCategory(true);
                      return;
                    }
                    setSelectedCategoryId(str);
                  }}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {localCategories.map((c) => (
                        <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                          {c.name}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                      <ListBox.Item
                        id="__create__"
                        textValue="Crear nueva categoría"
                        className="text-neutral-900 font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <Plus size={12} /> Crear categoría
                        </span>
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="p-name" className="mb-1 block text-xs font-medium text-neutral-600">
                Nombre *
              </Label>
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Hamburguesa clásica"
              />
            </div>

            <div>
              <Label htmlFor="p-desc" className="mb-1 block text-xs font-medium text-neutral-600">
                Descripción
              </Label>
              <textarea
                id="p-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ingredientes, detalles, etc."
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>

            <div>
              <NumberField
                value={price}
                onChange={(v) => setPrice(v)}
                minValue={0}
                step={500}
              >
                <Label className="mb-1 block text-xs font-medium text-neutral-600">
                  Precio (Gs.) *
                </Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input placeholder="0" />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
              <p className="mt-1 text-xs text-neutral-400">Precio sin IVA</p>
            </div>

            <div>
              <Label className="mb-1 block text-xs font-medium text-neutral-600">
                Imagen
              </Label>
              <ImageDropzone
                value={imageUrl}
                uploading={uploading}
                onUpload={uploadImage}
                onClear={() => setImageUrl(null)}
              />
            </div>

            {/* Modificadores embebidos — solo edit mode */}
            {isEditMode && (
              <Disclosure>
                <Disclosure.Heading>
                  <Button slot="trigger" variant="outline" className="w-full justify-between">
                    <span>Modificadores ({persistedGroups.length})</span>
                    <Disclosure.Indicator />
                  </Button>
                </Disclosure.Heading>
                <Disclosure.Content>
                  <Disclosure.Body>
                    <div className="pt-2">
                      <ModifierEditor
                        productId={product!.id}
                        groups={persistedGroups}
                        onChange={setPersistedGroups}
                      />
                    </div>
                  </Disclosure.Body>
                </Disclosure.Content>
              </Disclosure>
            )}

            {!isEditMode && (
              <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                Después de guardar el producto vas a poder agregar modificadores (tamaños, extras, etc.)
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-neutral-100 bg-white px-5 py-3">
            <Button type="button" variant="outline" onPress={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" isDisabled={isPending || uploading}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
