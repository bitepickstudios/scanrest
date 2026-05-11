"use client";

import { useState, useRef } from "react";
import type { Category, Product, ModifierGroup, Modifier } from "@/lib/types";
import ProductModal from "./ProductModal";

type ProductFull = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type CategoryFull = Category & { products: ProductFull[] };

export default function MenuSection({
  categories,
  restaurantId,
  restaurantSlug,
  tableId,
  mode,
}: {
  categories: CategoryFull[];
  restaurantId: string;
  restaurantSlug: string;
  tableId: string | null;
  mode: string;
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [selectedProduct, setSelectedProduct] = useState<ProductFull | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function scrollToCategory(id: string) {
    setActiveCategory(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const visibleCategories = categories.filter((c) => c.products.length > 0);

  if (visibleCategories.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-neutral-400">
          El menú aún no tiene productos disponibles.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Sticky category tabs */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide px-4 py-3">
          {visibleCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors mr-2 ${
                activeCategory === cat.id
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product sections */}
      <div className="px-4 pt-4 space-y-8">
        {visibleCategories.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => { sectionRefs.current[cat.id] = el; }}
          >
            <h2 className="mb-3 text-base font-bold text-neutral-800">{cat.name}</h2>
            <div className="space-y-3">
              {cat.products
                .filter((p) => p.available)
                .map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-neutral-900">{product.name}</p>
                      {product.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                          {product.description}
                        </p>
                      )}
                      <p className="mt-1.5 text-sm font-bold text-neutral-800">
                        Gs. {product.price.toLocaleString("es-PY")}
                      </p>
                    </div>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    )}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
