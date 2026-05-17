"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Minus, Search, Trash2, Check } from "lucide-react";
import { Button } from "@heroui/react";
import { createWaiterOrder } from "@/lib/actions/waiter-orders";

type Category = { id: string; name: string };
type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
};
type Override = { product_id: string; available: boolean; price_override: number | null };
type TableInfo = { id: string; label: string; capacity: number | null } | null;

type CartLine = {
  key: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export default function OrderTaker({
  restaurantSlug,
  branchSlug,
  branchId,
  table,
  categories,
  products,
  overrides,
}: {
  restaurantSlug: string;
  branchSlug: string;
  branchId: string;
  table: TableInfo;
  categories: Category[];
  products: Product[];
  overrides: Override[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [lines, setLines] = useState<CartLine[]>([]);
  const [step, setStep] = useState<"menu" | "checkout">("menu");
  const [customerName, setCustomerName] = useState(table ? "" : "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [ruc, setRuc] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [o.product_id, o])),
    [overrides]
  );

  const visibleProducts = useMemo(() => {
    return products
      .map((p) => {
        const o = overrideMap.get(p.id);
        return {
          ...p,
          effective_price: o?.price_override ?? p.price,
          available: o?.available ?? true,
        };
      })
      .filter((p) => p.available);
  }, [products, overrideMap]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      if (q) return p.name.toLowerCase().includes(q);
      return p.category_id === activeCat;
    });
  }, [visibleProducts, activeCat, search]);

  function addProduct(p: { id: string; name: string; effective_price: number }) {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          key: `${p.id}-${Date.now()}`,
          productId: p.id,
          productName: p.name,
          unitPrice: p.effective_price,
          quantity: 1,
        },
      ];
    });
  }

  function changeQty(key: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalPrice = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  function handleConfirm() {
    setError(null);
    if (!customerName.trim()) {
      setError("Nombre del cliente requerido.");
      return;
    }
    if (wantsInvoice && (!ruc.trim() || !razonSocial.trim())) {
      setError("Completá RUC y razón social.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createWaiterOrder({
          branchId,
          tableId: table?.id ?? null,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || null,
          notes: orderNotes.trim() || null,
          wantsInvoice,
          ruc: wantsInvoice ? ruc.trim() : null,
          razonSocial: wantsInvoice ? razonSocial.trim() : null,
          items: lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        });
        router.push(
          `/staff/${restaurantSlug}/${branchSlug}?ok=${result.orderNumber}`
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear pedido.");
      }
    });
  }

  if (step === "checkout") {
    const inputClass =
      "w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400";

    return (
      <div className="flex min-h-screen flex-col bg-neutral-50">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            onPress={() => setStep("menu")}
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-base font-semibold">Datos del cliente</h1>
        </header>

        <div className="flex-1 space-y-4 p-4 sm:p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <input
              autoFocus
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={inputClass}
              placeholder="Quién pidió"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Teléfono</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={inputClass}
              placeholder="+595..."
              inputMode="tel"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Notas del pedido</label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className={`${inputClass} min-h-[80px]`}
              placeholder="Sin cebolla, alergias, etc."
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={wantsInvoice}
              onChange={(e) => setWantsInvoice(e.target.checked)}
              className="h-5 w-5"
            />
            <span className="text-sm font-medium">¿Factura?</span>
          </label>

          {wantsInvoice && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">RUC *</label>
                <input
                  value={ruc}
                  onChange={(e) => setRuc(e.target.value)}
                  className={inputClass}
                  placeholder="80012345-6"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Razón social *</label>
                <input
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  className={inputClass}
                  placeholder="Empresa SA"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm text-neutral-500">
              {totalQty} ítem{totalQty === 1 ? "" : "s"}
            </span>
            <span className="text-lg font-bold">
              ₲ {totalPrice.toLocaleString("es-PY")}
            </span>
          </div>
          <Button
            variant="primary"
            fullWidth
            isDisabled={isPending}
            onPress={handleConfirm}
          >
            <Check size={16} />
            Confirmar pedido
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            onPress={() =>
              router.push(`/staff/${restaurantSlug}/${branchSlug}`)
            }
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-base font-semibold">
              {table ? table.label : "Para llevar"}
            </h1>
            {table?.capacity && (
              <p className="text-xs text-neutral-500">
                Cap. {table.capacity}
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-neutral-300 focus:bg-white"
          />
        </div>
        {!search && (
          <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCat(c.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCat === c.id
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 space-y-2 p-3 pb-32 sm:p-4">
        {filteredProducts.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            Sin productos.
          </p>
        ) : (
          filteredProducts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p)}
              className="flex w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-colors hover:border-neutral-300 active:bg-neutral-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {p.name}
                </p>
                {p.description && (
                  <p className="truncate text-xs text-neutral-500">
                    {p.description}
                  </p>
                )}
                <p className="mt-0.5 text-sm font-semibold text-neutral-700">
                  ₲ {p.effective_price.toLocaleString("es-PY")}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
                <Plus size={18} />
              </div>
            </button>
          ))
        )}
      </div>

      {lines.length > 0 && (
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-3">
          <details className="mb-2">
            <summary className="cursor-pointer text-xs font-semibold text-neutral-600">
              Ver ítems ({totalQty})
            </summary>
            <div className="mt-2 max-h-60 space-y-2 overflow-y-auto">
              {lines.map((l) => (
                <div
                  key={l.key}
                  className="flex items-center gap-2 rounded-lg bg-neutral-50 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {l.productName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      ₲ {l.unitPrice.toLocaleString("es-PY")} c/u
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    onPress={() => changeQty(l.key, -1)}
                    aria-label="-1"
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold">
                    {l.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    onPress={() => changeQty(l.key, 1)}
                    aria-label="+1"
                  >
                    <Plus size={14} />
                  </Button>
                  <Button
                    variant="danger-soft"
                    size="sm"
                    isIconOnly
                    onPress={() => removeLine(l.key)}
                    aria-label="Eliminar"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </details>
          <Button
            variant="primary"
            fullWidth
            onPress={() => setStep("checkout")}
          >
            Siguiente · ₲ {totalPrice.toLocaleString("es-PY")}
          </Button>
        </div>
      )}
    </div>
  );
}
