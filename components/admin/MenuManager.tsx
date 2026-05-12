"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Switch, Button } from "@heroui/react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
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
  categories: initial,
}: {
  restaurantId: string;
  categories: CategoryWithProducts[];
}) {
  const [categories, setCategories] = useState(initial);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initial[0]?.id ?? null
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [productModal, setProductModal] = useState<{
    product: ProductWithModifiers | null;
    categoryId: string;
  } | null>(null);
  const [modifierModal, setModifierModal] = useState<ProductWithModifiers | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const products = selectedCategory?.products ?? [];

  function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    startTransition(async () => {
      await createCategory(newCategoryName.trim());
      setNewCategoryName("");
      setShowAddCategory(false);
    });
  }

  function handleUpdateCategory(id: string, name: string) {
    startTransition(async () => {
      await updateCategory(id, name);
      setEditingCategory(null);
    });
  }

  function handleDeleteCategory(id: string) {
    if (!confirm("¿Eliminar categoría y todos sus productos?")) return;
    startTransition(async () => {
      await deleteCategory(id);
      if (selectedCategoryId === id) {
        const remaining = categories.filter((c) => c.id !== id);
        setSelectedCategoryId(remaining[0]?.id ?? null);
      }
    });
  }

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

  return (
    <div className="flex h-full gap-0">
      {/* Category sidebar */}
      <div className="w-52 shrink-0 border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Categorías
          </p>
        </div>
        <div className="space-y-0.5 p-2">
          {categories.map((cat) => (
            <div key={cat.id} className="group relative">
              {editingCategory?.id === cat.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateCategory(cat.id, editingCategory.name);
                  }}
                  className="flex gap-1"
                >
                  <input
                    autoFocus
                    value={editingCategory.name}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    className="w-full rounded px-2 py-1 text-sm border border-neutral-300 outline-none"
                  />
                  <button type="submit" className="text-xs text-neutral-600 px-1">
                    ✓
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedCategoryId === cat.id
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className={`text-xs ${selectedCategoryId === cat.id ? "text-neutral-300" : "text-neutral-400"}`}>
                    {cat.products.length}
                  </span>
                </button>
              )}
              {editingCategory?.id !== cat.id && (
                <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                  <button
                    onClick={() => setEditingCategory(cat)}
                    className="rounded p-1 hover:bg-neutral-200"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="rounded p-1 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-100 p-2">
          {showAddCategory ? (
            <div className="flex gap-1">
              <input
                autoFocus
                placeholder="Nueva categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="w-full rounded px-2 py-1.5 text-sm border border-neutral-300 outline-none"
              />
              <button
                onClick={handleAddCategory}
                disabled={isPending}
                className="rounded px-2 py-1.5 bg-neutral-900 text-white text-xs"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
            >
              <Plus size={12} /> Agregar categoría
            </button>
          )}
        </div>
      </div>

      {/* Products panel */}
      <div className="flex-1 p-6">
        {selectedCategory ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-800">
                {selectedCategory.name}
              </h2>
              <Button
                variant="primary"
                size="sm"
                onPress={() => setProductModal({ product: null, categoryId: selectedCategory.id })}
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
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
                  >
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-32 w-full object-cover"
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
                          onChange={() => handleToggleAvailability(product.id, product.available)}
                          size="sm"
                          aria-label={product.available ? "Disponible" : "No disponible"}
                        >
                          <Switch.Control><Switch.Thumb /></Switch.Control>
                        </Switch>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setProductModal({ product, categoryId: selectedCategory.id })}
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
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-neutral-400">
              Seleccioná una categoría para ver sus productos.
            </p>
          </div>
        )}
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
    </div>
  );
}
