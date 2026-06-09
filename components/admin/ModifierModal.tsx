"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@heroui/react";
import ModifierEditor, { GroupWithModifiers } from "./ModifierEditor";
import type { Product } from "@/lib/types";

type ProductWithModifiers = Product & {
  modifier_groups: GroupWithModifiers[];
};

export default function ModifierModal({
  product,
  onClose,
}: {
  product: ProductWithModifiers;
  onClose: () => void;
}) {
  const [groups, setGroups] = useState<GroupWithModifiers[]>(product.modifier_groups);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-[modal-backdrop_0.18s_ease-out]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl animate-[modal-in_0.18s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">Modificadores</h3>
            <p className="text-xs text-neutral-400">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          <ModifierEditor productId={product.id} groups={groups} onChange={setGroups} />
        </div>

        <div className="border-t border-neutral-100 px-5 py-3 text-right">
          <Button variant="outline" onPress={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
