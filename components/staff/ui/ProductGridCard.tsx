"use client";

import { Card, Chip } from "@heroui/react";

export type GridProduct = {
  id: string;
  name: string;
  description: string | null;
  effective_price: number;
  image_url: string | null;
};

export default function ProductGridCard({
  product,
  draftQty,
  onOpen,
  disabled,
}: {
  product: GridProduct;
  draftQty: number;
  onOpen: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="group relative text-left disabled:opacity-50 disabled:pointer-events-none"
    >
      <Card
        variant="default"
        className="overflow-hidden transition-transform group-active:scale-[0.97]"
      >
        <div className="relative h-32 w-full bg-neutral-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-neutral-100 to-neutral-200" />
          )}
          {draftQty > 0 && (
            <Chip
              size="sm"
              color="accent"
              variant="soft"
              className="absolute right-2 top-2 shadow"
            >
              x{draftQty}
            </Chip>
          )}
        </div>
        <Card.Content className="!p-3">
          <p className="line-clamp-1 text-sm font-semibold text-neutral-900">
            {product.name}
          </p>
          <p className="mt-0.5 text-sm font-bold text-neutral-700">
            ₲ {product.effective_price.toLocaleString("es-PY")}
          </p>
        </Card.Content>
      </Card>
    </button>
  );
}
