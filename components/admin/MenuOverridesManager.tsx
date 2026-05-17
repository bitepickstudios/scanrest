"use client";

import { useState, useTransition } from "react";
import { Switch } from "@heroui/react";
import {
  setProductAvailability,
  setProductPriceOverride,
} from "@/lib/actions/branch-products";

type Category = { id: string; name: string };
type Product = {
  id: string;
  category_id: string | null;
  name: string;
  price: number;
};
type Override = {
  product_id: string;
  available: boolean;
  price_override: number | null;
};

export default function MenuOverridesManager({
  branchId,
  categories,
  products,
  overrides: initial,
}: {
  branchId: string;
  categories: Category[];
  products: Product[];
  overrides: Override[];
}) {
  const initialMap = new Map(initial.map((o) => [o.product_id, o]));
  const [state, setState] = useState<Map<string, Override>>(initialMap);
  const [isPending, startTransition] = useTransition();

  function getOverride(productId: string): Override {
    return (
      state.get(productId) ?? {
        product_id: productId,
        available: true,
        price_override: null,
      }
    );
  }

  function update(productId: string, patch: Partial<Override>) {
    setState((prev) => {
      const next = new Map(prev);
      const cur = next.get(productId) ?? {
        product_id: productId,
        available: true,
        price_override: null,
      };
      next.set(productId, { ...cur, ...patch });
      return next;
    });
  }

  function toggleAvailable(productId: string, available: boolean) {
    update(productId, { available });
    startTransition(async () => {
      try {
        await setProductAvailability(branchId, productId, available);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function setPrice(productId: string, raw: string) {
    const parsed = raw === "" ? null : parseFloat(raw);
    const value = parsed != null && !isNaN(parsed) ? parsed : null;
    update(productId, { price_override: value });
    startTransition(async () => {
      try {
        await setProductPriceOverride(branchId, productId, value);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error");
      }
    });
  }

  const productsByCategory = new Map<string | null, Product[]>();
  for (const p of products) {
    const arr = productsByCategory.get(p.category_id) ?? [];
    arr.push(p);
    productsByCategory.set(p.category_id, arr);
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center">
        <p className="text-sm text-neutral-500">
          No hay productos en el menú maestro todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const items = productsByCategory.get(cat.id) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={cat.id}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {cat.name}
            </h3>
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs text-neutral-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Producto</th>
                    <th className="px-4 py-2 font-medium">Precio maestro</th>
                    <th className="px-4 py-2 font-medium">Precio sucursal</th>
                    <th className="px-4 py-2 font-medium text-right">
                      Disponible
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const o = getOverride(p.id);
                    return (
                      <tr
                        key={p.id}
                        className="border-t border-neutral-100"
                      >
                        <td className="px-4 py-2 font-medium text-neutral-800">
                          {p.name}
                        </td>
                        <td className="px-4 py-2 text-neutral-500">
                          ₲ {p.price.toLocaleString("es-PY")}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={o.price_override ?? ""}
                            onChange={(e) => setPrice(p.id, e.target.value)}
                            placeholder="—"
                            className="w-28 rounded-lg border border-neutral-200 px-2 py-1 text-sm outline-none focus:border-neutral-400"
                            disabled={isPending}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Switch
                            isSelected={o.available}
                            onChange={() =>
                              toggleAvailable(p.id, !o.available)
                            }
                            size="sm"
                            aria-label={
                              o.available
                                ? "Disponible en sucursal"
                                : "No disponible en sucursal"
                            }
                          >
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
