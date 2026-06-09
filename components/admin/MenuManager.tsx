"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, ChevronRight, Settings2, X, ArrowUp, ArrowDown, Check } from "lucide-react";
import { Switch, Button, Tabs, Chip } from "@heroui/react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  deleteProduct,
  toggleProductAvailability,
} from "@/lib/actions/menu";
import ProductModal from "./ProductModal";
import ModifierModal from "./ModifierModal";
import type { Category, Product, ModifierGroup, Modifier } from "@/lib/types";

type ProductWithModifiers = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type CategoryWithProducts = Category & { products: ProductWithModifiers[] };

export default function MenuManager({
  restaurantId,
  categories,
}: {
  restaurantId: string;
  categories: CategoryWithProducts[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [productModal, setProductModal] = useState<{
    product: ProductWithModifiers | null;
    categoryId: string;
  } | null>(null);
  const [modifierModal, setModifierModal] = useState<ProductWithModifiers | null>(null);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? categories[0],
    [categories, selectedCategoryId]
  );
  const products = selectedCategory?.products ?? [];

  function handleDeleteProduct(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    startTransition(async () => {
      await deleteProduct(id);
    });
  }

  function handleToggleAvailability(id: string, current: boolean) {
    startTransition(async () => {
      await toggleProductAvailability(id, !current);
    });
  }

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="max-w-sm text-center">
          <p className="text-base font-semibold text-neutral-800">
            Sin categorías aún
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Empezá creando categorías para organizar tu menú.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onPress={() => setShowCategoriesModal(true)}
          >
            <Plus size={14} /> Crear categoría
          </Button>
          {showCategoriesModal && (
            <CategoriesModal
              categories={categories}
              onClose={() => setShowCategoriesModal(false)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1 overflow-x-auto">
          <Tabs
            selectedKey={selectedCategory?.id ?? undefined}
            onSelectionChange={(k) => setSelectedCategoryId(String(k))}
          >
            <Tabs.ListContainer className="w-fit">
              <Tabs.List
                aria-label="Categorías"
                className="w-fit *:h-8 *:w-fit *:px-3 *:text-sm *:font-medium"
              >
                {categories.map((cat) => (
                  <Tabs.Tab key={cat.id} id={cat.id}>
                    <span className="flex items-center gap-1.5">
                      {cat.name}
                      <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500">
                        {cat.products.length}
                      </span>
                    </span>
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setShowCategoriesModal(true)}
        >
          <Settings2 size={14} /> Gestionar categorías
        </Button>
      </div>

      <div>
        {selectedCategory ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-800">
                  {selectedCategory.name}
                </h2>
                <p className="text-xs text-neutral-500">
                  {products.length} producto{products.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onPress={() =>
                  setProductModal({
                    product: null,
                    categoryId: selectedCategory.id,
                  })
                }
              >
                <Plus size={14} /> Agregar producto
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200">
                <p className="text-sm text-neutral-400">
                  Sin productos. Agregá el primero.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-36 w-full object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-neutral-800">
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                              {product.description}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-bold text-neutral-800">
                            Gs. {product.price.toLocaleString("es-PY")}
                          </p>
                        </div>
                        <Switch
                          isSelected={product.available}
                          onChange={() =>
                            handleToggleAvailability(product.id, product.available)
                          }
                          size="sm"
                          aria-label={product.available ? "Disponible" : "No disponible"}
                        >
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                        </Switch>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() =>
                            setProductModal({
                              product,
                              categoryId: selectedCategory.id,
                            })
                          }
                        >
                          <Pencil size={11} /> Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setModifierModal(product)}
                        >
                          <ChevronRight size={11} /> Modificadores
                        </Button>
                        <Button
                          variant="danger-soft"
                          size="sm"
                          isIconOnly
                          onPress={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 size={11} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {productModal && (
        <ProductModal
          restaurantId={restaurantId}
          categories={categories}
          categoryId={productModal.categoryId}
          product={productModal.product}
          onClose={() => setProductModal(null)}
        />
      )}

      {modifierModal && (
        <ModifierModal
          product={modifierModal}
          onClose={() => setModifierModal(null)}
        />
      )}

      {showCategoriesModal && (
        <CategoriesModal
          categories={categories}
          onClose={() => setShowCategoriesModal(false)}
        />
      )}
    </div>
  );
}

function CategoriesModal({
  categories,
  onClose,
}: {
  categories: CategoryWithProducts[];
  onClose: () => void;
}) {
  const [order, setOrder] = useState(categories.map((c) => c.id));
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CategoryWithProducts | null>(null);
  const [isPending, startTransition] = useTransition();

  const byId = useMemo(() => {
    const m = new Map<string, CategoryWithProducts>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  useEffect(() => {
    setOrder((prev) => {
      const known = new Set(prev);
      const fromProps = categories.map((c) => c.id);
      const incomingSet = new Set(fromProps);
      const kept = prev.filter((id) => incomingSet.has(id));
      const added = fromProps.filter((id) => !known.has(id));
      return [...kept, ...added];
    });
  }, [categories]);

  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    startTransition(async () => {
      try {
        await reorderCategories(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al reordenar");
      }
    });
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      try {
        await createCategory(name);
        setNewName("");
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear");
      }
    });
  }

  function handleRename() {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      try {
        await updateCategory(editing.id, name);
        setEditing(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function performDelete(id: string) {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategory(id);
        setOrder((prev) => prev.filter((x) => x !== id));
        setConfirmDelete(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">Gestionar categorías</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-1">
            {order.map((id, idx) => {
              const cat = byId.get(id);
              if (!cat) return null;
              const isEditing = editing?.id === id;
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2 py-1.5"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0 || isPending}
                      className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Subir"
                    >
                      <ArrowUp size={11} />
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === order.length - 1 || isPending}
                      className="rounded p-0.5 text-neutral-400 hover:bg-neutral-100 disabled:opacity-30"
                      aria-label="Bajar"
                    >
                      <ArrowDown size={11} />
                    </button>
                  </div>
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename();
                        if (e.key === "Escape") setEditing(null);
                      }}
                      className="flex-1 rounded border border-neutral-300 px-2 py-1 text-sm outline-none"
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm font-medium text-neutral-800">
                      {cat.name}
                    </span>
                  )}
                  <Chip size="sm" variant="soft">
                    <Chip.Label>{cat.products.length}</Chip.Label>
                  </Chip>
                  {isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={handleRename}
                      aria-label="Guardar"
                    >
                      <Check size={13} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      onPress={() => setEditing({ id, name: cat.name })}
                      aria-label="Editar"
                    >
                      <Pencil size={12} />
                    </Button>
                  )}
                  <Button
                    variant="danger-soft"
                    size="sm"
                    isIconOnly
                    onPress={() => setConfirmDelete(cat)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-neutral-100 p-5">
          <div className="flex items-center gap-2">
            <input
              placeholder="Nueva categoría"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className={inputClass}
            />
            <Button
              variant="primary"
              onPress={handleCreate}
              isDisabled={isPending || !newName.trim()}
            >
              <Plus size={14} /> Crear
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" onPress={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDeleteCategoryModal
          category={confirmDelete}
          isPending={isPending}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => performDelete(confirmDelete.id)}
        />
      )}
    </div>
  );
}

function ConfirmDeleteCategoryModal({
  category,
  isPending,
  onCancel,
  onConfirm,
}: {
  category: CategoryWithProducts;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const count = category.products.length;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
          <h2 className="text-base font-semibold">Eliminar categoría</h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-neutral-700">
            ¿Seguro que querés eliminar{" "}
            <span className="font-semibold">{category.name}</span>?
          </p>
          {count > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Se eliminarán también {count} producto{count === 1 ? "" : "s"} asociado
              {count === 1 ? "" : "s"}. Esta acción no se puede deshacer.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onPress={onCancel} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button variant="danger-soft" onPress={onConfirm} isDisabled={isPending}>
              <Trash2 size={14} /> Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
