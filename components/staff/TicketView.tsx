"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Minus,
  Search,
  Trash2,
  Send,
  Receipt,
  DoorClosed,
  Users,
  Clock,
} from "lucide-react";
import { Button, Chip } from "@heroui/react";
import { createWaiterOrder } from "@/lib/actions/waiter-orders";
import {
  closeTableSession,
  openTableSessionAsWaiter,
  requestBill,
} from "@/lib/actions/table-sessions";

type Category = { id: string; name: string };
type Product = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
};
type Override = { product_id: string; available: boolean; price_override: number | null };
type TableInfo = { id: string; label: string; capacity: number | null };
type SessionLite = {
  id: string;
  customer_name: string | null;
  party_size: number | null;
  opened_at: string;
  bill_requested_at: string | null;
  status: string;
} | null;

type SubmittedOrder = {
  id: string;
  order_number: number;
  status: string;
  source: string;
  created_at: string;
  customer_name: string;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
  }>;
};

type CartLine = {
  key: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

const inputClass =
  "w-full rounded-xl border border-neutral-200 px-4 py-3 text-base outline-none focus:border-neutral-400";

export default function TicketView({
  restaurantSlug,
  branchSlug,
  branchId,
  table,
  session,
  submittedOrders,
  categories,
  products,
  overrides,
}: {
  restaurantSlug: string;
  branchSlug: string;
  branchId: string;
  table: TableInfo;
  session: SessionLite;
  submittedOrders: SubmittedOrder[];
  categories: Category[];
  products: Product[];
  overrides: Override[];
}) {
  const router = useRouter();
  const billLocked = !!session?.bill_requested_at;

  const [openName, setOpenName] = useState("");
  const [openParty, setOpenParty] = useState<string>("");
  const [openError, setOpenError] = useState<string | null>(null);
  const [openingSession, startOpenSession] = useTransition();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [lines, setLines] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionPending, startAction] = useTransition();

  const overrideMap = useMemo(
    () => new Map(overrides.map((o) => [o.product_id, o])),
    [overrides]
  );

  const visibleProducts = useMemo(
    () =>
      products
        .map((p) => {
          const o = overrideMap.get(p.id);
          return {
            ...p,
            effective_price: o?.price_override ?? p.price,
            available: o?.available ?? true,
          };
        })
        .filter((p) => p.available),
    [products, overrideMap]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      if (q) return p.name.toLowerCase().includes(q);
      return p.category_id === activeCat;
    });
  }, [visibleProducts, activeCat, search]);

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalDraft = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const submittedTotal = submittedOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    0
  );
  const grandTotal = submittedTotal + totalDraft;

  function addProduct(p: { id: string; name: string; effective_price: number }) {
    if (billLocked) return;
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

  function handleOpenTable() {
    setOpenError(null);
    if (!openName.trim()) {
      setOpenError("Nombre o referencia requerido.");
      return;
    }
    const partyNum = openParty ? parseInt(openParty, 10) : null;
    startOpenSession(async () => {
      try {
        await openTableSessionAsWaiter({
          branchId,
          tableId: table.id,
          customerName: openName.trim(),
          partySize: partyNum,
        });
        router.refresh();
      } catch (err) {
        setOpenError(err instanceof Error ? err.message : "Error al abrir mesa.");
      }
    });
  }

  function handleSendToKitchen() {
    if (!session) {
      setError("Abrí la mesa antes de enviar items.");
      return;
    }
    if (lines.length === 0) return;
    setError(null);
    startTransition(async () => {
      try {
        await createWaiterOrder({
          branchId,
          tableId: table.id,
          sessionId: session.id,
          customerName: session.customer_name?.trim() || "Mesa",
          items: lines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        });
        setLines([]);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al enviar a cocina.");
      }
    });
  }

  function handleRequestBill() {
    if (!session) return;
    startAction(async () => {
      try {
        await requestBill(session.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al pedir cuenta.");
      }
    });
  }

  function handleCloseTable() {
    if (!session) return;
    startAction(async () => {
      try {
        await closeTableSession(session.id, restaurantSlug, branchSlug);
        router.push(`/staff/${restaurantSlug}/${branchSlug}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cerrar mesa.");
      }
    });
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-neutral-50">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            onPress={() => router.push(`/staff/${restaurantSlug}/${branchSlug}`)}
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-base font-semibold">{table.label}</h1>
            {table.capacity && (
              <p className="text-xs text-neutral-500">Cap. {table.capacity}</p>
            )}
          </div>
        </header>
        <div className="flex-1 space-y-4 p-4 sm:p-6">
          <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-6 text-center">
            <p className="text-sm font-medium text-neutral-700">
              Mesa libre. Abrila para empezar a tomar el pedido.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Cliente / referencia *
            </label>
            <input
              autoFocus
              value={openName}
              onChange={(e) => setOpenName(e.target.value)}
              className={inputClass}
              placeholder="Sr. Pérez · Mesa 5"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Comensales</label>
            <input
              value={openParty}
              onChange={(e) => setOpenParty(e.target.value)}
              className={inputClass}
              placeholder="2"
              inputMode="numeric"
            />
          </div>
          {openError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {openError}
            </p>
          )}
          <Button
            variant="primary"
            fullWidth
            isDisabled={openingSession}
            onPress={handleOpenTable}
          >
            Abrir mesa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            isIconOnly
            size="sm"
            onPress={() => router.push(`/staff/${restaurantSlug}/${branchSlug}`)}
            aria-label="Volver"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold">{table.label}</h1>
              {billLocked && (
                <Chip size="sm" color="warning" variant="soft">
                  Cuenta pedida
                </Chip>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
              <span>{session.customer_name ?? "Mesa"}</span>
              {session.party_size && (
                <span className="flex items-center gap-1">
                  <Users size={11} /> {session.party_size}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {new Date(session.opened_at).toLocaleTimeString("es-PY", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="relative mt-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-neutral-300 focus:bg-white"
            disabled={billLocked}
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

      <div className="flex-1 space-y-4 p-3 pb-40 sm:p-4">
        {submittedOrders.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ya enviado ({submittedOrders.length})
            </h2>
            {submittedOrders.map((o) => (
              <div
                key={o.id}
                className="rounded-xl border border-neutral-200 bg-white p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700">
                    #{o.order_number} · {o.source === "waiter" ? "Mozo" : "QR"} ·{" "}
                    {o.customer_name}
                  </span>
                  <Chip size="sm" variant="soft">
                    {o.status}
                  </Chip>
                </div>
                <ul className="space-y-1">
                  {o.items.map((it) => (
                    <li
                      key={it.id}
                      className="flex justify-between text-sm text-neutral-700"
                    >
                      <span>
                        {it.quantity}× {it.product_name}
                      </span>
                      <span>
                        ₲ {(it.quantity * it.unit_price).toLocaleString("es-PY")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {!billLocked && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Agregar al pedido
            </h2>
            {filteredProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
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
          </section>
        )}

        {billLocked && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Cuenta solicitada por el cliente. No se pueden agregar más items.
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-neutral-200 bg-white p-3">
        {lines.length > 0 && (
          <details open className="mb-2">
            <summary className="cursor-pointer text-xs font-semibold text-neutral-600">
              Borrador ({totalQty})
            </summary>
            <div className="mt-2 max-h-52 space-y-2 overflow-y-auto">
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
        )}
        {error && (
          <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="text-neutral-500">Total mesa</span>
          <span className="text-lg font-bold">
            ₲ {grandTotal.toLocaleString("es-PY")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="primary"
            size="sm"
            isDisabled={billLocked || lines.length === 0 || isPending}
            onPress={handleSendToKitchen}
            className="col-span-3"
          >
            <Send size={14} />
            Enviar a cocina
            {lines.length > 0 && ` · ₲ ${totalDraft.toLocaleString("es-PY")}`}
          </Button>
          <Button
            variant="outline"
            size="sm"
            isDisabled={billLocked || actionPending}
            onPress={handleRequestBill}
            className="col-span-2"
          >
            <Receipt size={14} />
            Pedir cuenta
          </Button>
          <Button
            variant="danger-soft"
            size="sm"
            isDisabled={actionPending}
            onPress={handleCloseTable}
          >
            <DoorClosed size={14} />
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
