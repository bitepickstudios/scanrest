"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  NumberField,
  SearchField,
  Tabs,
  TextArea,
  TextField,
} from "@heroui/react";
import StaffAlert from "@/components/staff/ui/StaffAlert";
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
  const [customerName, setCustomerName] = useState("");
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

  function setQty(key: string, qty: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: qty } : l))
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
          <TextField
            isRequired
            value={customerName}
            onChange={setCustomerName}
            autoFocus
            className="w-full"
          >
            <Label>Nombre</Label>
            <Input placeholder="Quién pidió" />
          </TextField>

          <TextField
            value={customerPhone}
            onChange={setCustomerPhone}
            className="w-full"
          >
            <Label>Teléfono</Label>
            <Input placeholder="+595..." inputMode="tel" />
          </TextField>

          <TextField
            value={orderNotes}
            onChange={setOrderNotes}
            className="w-full"
          >
            <Label>Notas del pedido</Label>
            <TextArea rows={3} placeholder="Sin cebolla, alergias, etc." />
          </TextField>

          <Card variant="default">
            <Card.Content className="!p-4">
              <Checkbox
                id="wants-invoice"
                isSelected={wantsInvoice}
                onChange={setWantsInvoice}
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label htmlFor="wants-invoice">¿Factura?</Label>
                </Checkbox.Content>
              </Checkbox>
            </Card.Content>
          </Card>

          {wantsInvoice && (
            <>
              <TextField
                isRequired
                value={ruc}
                onChange={setRuc}
                className="w-full"
              >
                <Label>RUC</Label>
                <Input placeholder="80012345-6" />
              </TextField>
              <TextField
                isRequired
                value={razonSocial}
                onChange={setRazonSocial}
                className="w-full"
              >
                <Label>Razón social</Label>
                <Input placeholder="Empresa SA" />
              </TextField>
            </>
          )}

          {error && <StaffAlert status="danger" description={error} />}
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
              <p className="text-xs text-neutral-500">Cap. {table.capacity}</p>
            )}
          </div>
        </div>

        <SearchField
          value={search}
          onChange={setSearch}
          aria-label="Buscar producto"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Buscar producto..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {!search && categories.length > 0 && (
          <Tabs
            selectedKey={activeCat ?? undefined}
            onSelectionChange={(k) => setActiveCat(String(k))}
            className="mt-3"
          >
            <Tabs.ListContainer className="overflow-x-auto scrollbar-hide">
              <Tabs.List aria-label="Categorías" className="w-max">
                {categories.map((c) => (
                  <Tabs.Tab key={c.id} id={c.id}>
                    {c.name}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
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
                  <NumberField
                    value={l.quantity}
                    onChange={(n) => setQty(l.key, n ?? 0)}
                    minValue={0}
                    step={1}
                    aria-label={`Cantidad ${l.productName}`}
                  >
                    <NumberField.Group className="w-28">
                      <NumberField.DecrementButton />
                      <NumberField.Input className="w-10 text-center" />
                      <NumberField.IncrementButton />
                    </NumberField.Group>
                  </NumberField>
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
