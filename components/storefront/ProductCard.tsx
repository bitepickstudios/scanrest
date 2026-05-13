"use client";

import { useMemo, useState } from "react";
import { Plus, Check, Pencil } from "lucide-react";
import { Card } from "@heroui/react";
import type { Product, ModifierGroup, Modifier } from "@/lib/types";
import { useCartStore } from "@/lib/stores/cart";
import QuantityStepper from "./QuantityStepper";

export type ProductFull = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};

export default function ProductCard({
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
          <div className="relative h-24 w-24 shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-24 w-24 rounded-xl object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-neutral-100" />
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
