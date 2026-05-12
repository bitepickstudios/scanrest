"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { useCartStore } from "@/lib/stores/cart";
import CartSheet from "./CartSheet";

export default function CartButton({
  restaurantSlug,
  tableId,
  mode,
}: {
  restaurantSlug: string;
  tableId: string | null;
  mode: string;
}) {
  const [open, setOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalPrice = useCartStore((s) => s.totalPrice());

  if (totalItems === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6">
        <Button
          variant="primary"
          onPress={() => setOpen(true)}
          className="w-full flex items-center justify-between px-5 py-4 h-auto rounded-2xl shadow-xl"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
              {totalItems}
            </span>
            <span className="font-medium">Ver pedido</span>
          </div>
          <span className="font-bold">Gs. {totalPrice.toLocaleString("es-PY")}</span>
        </Button>
      </div>

      {open && (
        <CartSheet
          restaurantSlug={restaurantSlug}
          tableId={tableId}
          mode={mode}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
