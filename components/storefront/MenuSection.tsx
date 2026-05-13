"use client";

import { useState, useRef, useMemo } from "react";
import { Search, X, Plus, Minus, Check, Pencil, Flame } from "lucide-react";
import { Card, Tabs } from "@heroui/react";
import type { Category, Product, ModifierGroup, Modifier } from "@/lib/types";
import { useCartStore } from "@/lib/stores/cart";
import ProductModal from "./ProductModal";
import QuantityStepper from "./QuantityStepper";

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
            <h2 className="mb-3 flex items-center gap-2 px-4 text-base font-bold text-neutral-800">
              <Flame size={16} className="text-orange-500" />
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
            <h2 className="mb-3 text-base font-bold text-neutral-800">{cat.name}</h2>
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

function ProductCard({
  product,
  onOpen,
  compact = false,
}: {
  product: ProductFull;
  onOpen: () => void;
  compact?: boolean;
}) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [stepperOpen, setStepperOpen] = useState(false);

  const hasVariants = (product.modifier_groups?.length ?? 0) > 0;
  const productItems = useMemo(
    () => items.filter((i) => i.product.id === product.id),
    [items, product.id]
  );
  const totalQty = productItems.reduce((s, i) => s + i.quantity, 0);
  const inCart = totalQty > 0;
  const lastItem = productItems[productItems.length - 1];

  function handleQuickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasVariants) {
      onOpen();
    } else {
      addItem(product, [], 1, "");
    }
  }

  function handleStepperInc(e: React.MouseEvent) {
    e.stopPropagation();
    if (hasVariants) {
      onOpen();
      return;
    }
    if (lastItem) {
      updateQuantity(lastItem.key, lastItem.quantity + 1);
    } else {
      addItem(product, [], 1, "");
    }
  }

  function handleStepperDec(e: React.MouseEvent) {
    e.stopPropagation();
    if (!lastItem) return;
    updateQuantity(lastItem.key, lastItem.quantity - 1);
  }

  if (compact) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="relative w-40 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-neutral-100 bg-white text-left shadow-sm active:scale-[0.98] transition-transform"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-28 w-full object-cover"
          />
        ) : (
          <div className="h-28 w-full bg-neutral-100" />
        )}
        <div className="p-2.5">
          <p className="line-clamp-1 text-sm font-semibold text-neutral-900">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs font-bold text-neutral-700">
            Gs. {product.price.toLocaleString("es-PY")}
          </p>
        </div>

        {!inCart && (
          <button
            type="button"
            onClick={handleQuickAdd}
            aria-label="Agregar"
            className="absolute right-2 top-[6.25rem] flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md ring-2 ring-white active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        )}

        {inCart && !stepperOpen && (
          <div className="absolute right-2 top-[6.25rem] flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStepperOpen(true);
              }}
              aria-label="Editar"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-2 ring-white active:scale-95"
            >
              <Pencil size={14} strokeWidth={2.5} />
            </button>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-[var(--accent-foreground)] shadow-md ring-2 ring-white">
              {totalQty > 1 ? (
                <span className="text-xs font-bold">{totalQty}</span>
              ) : (
                <Check size={16} strokeWidth={2.5} />
              )}
            </span>
          </div>
        )}

        {inCart && stepperOpen && (
          <div className="absolute right-2 top-[6rem]">
            <QuantityStepper
              size="sm"
              value={totalQty}
              onIncrement={handleStepperInc}
              onDecrement={handleStepperDec}
              onClickCapture={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="block w-full cursor-pointer text-left active:scale-[0.98] transition-transform"
    >
      <Card variant="default" className="rounded-2xl shadow-sm overflow-hidden">
        <Card.Content className="!flex !flex-row items-center gap-3">
          <div className="flex-1 min-w-0 pl-1">
            <p className="font-semibold text-neutral-900">{product.name}</p>
            {product.description && (
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                {product.description}
              </p>
            )}
            <p className="mt-1 text-sm font-bold text-neutral-800">
              Gs. {product.price.toLocaleString("es-PY")}
            </p>
          </div>
          <div className="relative h-20 w-20 shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-20 w-20 rounded-xl object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-neutral-100" />
            )}

            {!inCart && (
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label="Agregar"
                className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-md ring-2 ring-white active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            )}

            {inCart && !stepperOpen && (
              <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStepperOpen(true);
                  }}
                  aria-label="Editar"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-2 ring-white active:scale-95"
                >
                  <Pencil size={14} strokeWidth={2.5} />
                </button>
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--accent)] px-2 text-[var(--accent-foreground)] shadow-md ring-2 ring-white">
                  {totalQty > 1 ? (
                    <span className="text-xs font-bold">{totalQty}</span>
                  ) : (
                    <Check size={16} strokeWidth={2.5} />
                  )}
                </span>
              </div>
            )}

            {inCart && stepperOpen && (
              <div className="absolute -bottom-2 -right-1.5">
                <QuantityStepper
                  size="sm"
                  value={totalQty}
                  onIncrement={handleStepperInc}
                  onDecrement={handleStepperDec}
                  onClickCapture={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
