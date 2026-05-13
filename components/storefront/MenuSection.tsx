"use client";

import { useState, useRef, useMemo } from "react";
import { Search, X, Flame } from "lucide-react";
import { Tabs } from "@heroui/react";
import type { Category, Product, ModifierGroup, Modifier } from "@/lib/types";
import ProductModal from "./ProductModal";
import ProductCard from "./ProductCard";

type ProductFull = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};
type CategoryFull = Category & { products: ProductFull[] };

export default function MenuSection({
  categories,
  bestsellers = [],
  restaurantId,
  restaurantSlug,
  tableId,
  mode,
}: {
  categories: CategoryFull[];
  bestsellers?: ProductFull[];
  restaurantId: string;
  restaurantSlug: string;
  tableId: string | null;
  mode: string;
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [selectedProduct, setSelectedProduct] = useState<ProductFull | null>(null);
  const [query, setQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [] as ProductFull[];
    return categories.flatMap((c) =>
      c.products.filter(
        (p) =>
          p.available &&
          (p.name.toLowerCase().includes(normalizedQuery) ||
            (p.description ?? "").toLowerCase().includes(normalizedQuery))
      )
    );
  }, [categories, normalizedQuery]);

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

  const renderProductCard = (product: ProductFull) => (
    <ProductCard
      key={product.id}
      product={product}
      onOpen={() => setSelectedProduct(product)}
    />
  );

  return (
    <>
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en el menú..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-neutral-400 focus:bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpiar"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:text-neutral-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        {!normalizedQuery && (
          <Tabs
            selectedKey={activeCategory}
            onSelectionChange={(key) => scrollToCategory(String(key))}
          >
            <Tabs.ListContainer className="px-4 py-2">
              <Tabs.List
                aria-label="Categorías"
                className="w-fit overflow-x-auto scrollbar-hide *:w-fit *:shrink-0 *:px-3"
              >
                {visibleCategories.map((cat) => (
                  <Tabs.Tab key={cat.id} id={cat.id}>
                    {cat.name}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        )}
      </div>

      {normalizedQuery ? (
        <div className="px-4 pt-4 pb-8">
          <p className="mb-3 text-xs text-neutral-500">
            {searchResults.length} resultado
            {searchResults.length === 1 ? "" : "s"} para &quot;{query}&quot;
          </p>
          {searchResults.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm text-neutral-400">Sin resultados.</p>
            </div>
          ) : (
            <div className="space-y-3">{searchResults.map(renderProductCard)}</div>
          )}
        </div>
      ) : (
      <div className="px-4 pt-4 space-y-8">
        {bestsellers.length > 0 && (
          <div className="-mx-4">
            <h2 className="mb-3 flex items-center gap-2 px-4 text-lg font-bold text-foreground">
              Productos más vendidos
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
              {bestsellers.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onOpen={() => setSelectedProduct(p)}
                  compact
                />
              ))}
            </div>
          </div>
        )}
        {visibleCategories.map((cat) => (
          <div
            key={cat.id}
            ref={(el) => { sectionRefs.current[cat.id] = el; }}
          >
            <h2 className="mb-3 text-lg font-bold text-foreground">{cat.name}</h2>
            <div className="space-y-3">
              {cat.products.filter((p) => p.available).map(renderProductCard)}
            </div>
          </div>
        ))}
      </div>
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
