"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  DoorClosed,
  Users,
  Clock,
  ShoppingBag,
} from "lucide-react";
import {
  AlertDialog,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  NumberField,
  SearchField,
  Tabs,
  TextField,
} from "@heroui/react";
import StaffAlert from "@/components/staff/ui/StaffAlert";
import ProductGridCard from "@/components/staff/ui/ProductGridCard";
import StaffProductModal, {
  type ProductFull,
  type SelectedModifier,
} from "@/components/staff/StaffProductModal";
import CartSheet from "@/components/staff/CartSheet";
import { createWaiterOrder } from "@/lib/actions/waiter-orders";
import {
  closeTableSession,
  openTableSessionAsWaiter,
} from "@/lib/actions/table-sessions";

type Category = { id: string; name: string };
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
  modifiers: SelectedModifier[];
  notes: string | null;
};

type PendingOrder = {
  tempId: string;
  customer_name: string;
  items: { product_name: string; quantity: number; unit_price: number }[];
};

function modifiersKey(mods: SelectedModifier[], notes: string | null): string {
  const ids = mods.map((m) => m.id).sort().join("|");
  return `${ids}__${notes ?? ""}`;
}

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
  products: ProductFull[];
  overrides: Override[];
}) {
  const router = useRouter();
  const billLocked = !!session?.bill_requested_at;

  const [openName, setOpenName] = useState("");
  const [openParty, setOpenParty] = useState<number | undefined>(undefined);
  const [openError, setOpenError] = useState<string | null>(null);
  const [openingSession, startOpenSession] = useTransition();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(
    categories[0]?.id ?? null
  );
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionPending, startAction] = useTransition();
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [openProduct, setOpenProduct] = useState<ProductFull | null>(null);

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

  const draftQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of lines) {
      map.set(l.productId, (map.get(l.productId) ?? 0) + l.quantity);
    }
    return map;
  }, [lines]);

  const totalQty = lines.reduce((s, l) => s + l.quantity, 0);
  const totalDraft = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const submittedTotal = submittedOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    0
  );
  const pendingTotal = pendingOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    0
  );
  const grandTotal = submittedTotal + pendingTotal + totalDraft;

  function addProductWithMods(
    product: ProductFull & { effective_price: number },
    modifiers: SelectedModifier[],
    quantity: number,
    note: string
  ) {
    if (billLocked) return;
    const notes = note.trim() || null;
    const unitPrice =
      product.effective_price + modifiers.reduce((s, m) => s + m.price_delta, 0);
    const sig = modifiersKey(modifiers, notes);
    setLines((prev) => {
      const existing = prev.find(
        (l) =>
          l.productId === product.id &&
          modifiersKey(l.modifiers, l.notes) === sig
      );
      if (existing) {
        return prev.map((l) =>
          l === existing ? { ...l, quantity: l.quantity + quantity } : l
        );
      }
      return [
        ...prev,
        {
          key: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity,
          modifiers,
          notes,
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

  function handleOpenTable() {
    setOpenError(null);
    if (!openName.trim()) {
      setOpenError("Nombre o referencia requerido.");
      return;
    }
    const partyNum = openParty ?? null;
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

    const tempId = `pending-${Date.now()}`;
    const snapshot = lines;
    const optimistic: PendingOrder = {
      tempId,
      customer_name: session.customer_name?.trim() || "Mesa",
      items: snapshot.map((l) => ({
        product_name: l.productName,
        quantity: l.quantity,
        unit_price: l.unitPrice,
      })),
    };
    setPendingOrders((prev) => [...prev, optimistic]);
    setLines([]);

    startTransition(async () => {
      try {
        await createWaiterOrder({
          branchId,
          tableId: table.id,
          sessionId: session.id,
          customerName: optimistic.customer_name,
          items: snapshot.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            notes: l.notes,
            modifiers: l.modifiers.map((m) => ({
              name: m.name,
              priceDelta: m.price_delta,
            })),
          })),
        });
        setPendingOrders((prev) => prev.filter((o) => o.tempId !== tempId));
        router.refresh();
      } catch (err) {
        setPendingOrders((prev) => prev.filter((o) => o.tempId !== tempId));
        setLines(snapshot);
        setError(err instanceof Error ? err.message : "Error al enviar a cocina.");
      }
    });
  }

  function handleCloseTable() {
    if (!session) return;
    setConfirmCloseOpen(false);
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

  const sessionOpen = !!session;

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
              {!sessionOpen && (
                <Chip size="sm" variant="soft">
                  Libre
                </Chip>
              )}
            </div>
            {sessionOpen && session && (
              <div className="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
                <span>{session.customer_name ?? "Mesa"}</span>
                {session.party_size && (
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {session.party_size}
                  </span>
                )}
                <span className="flex items-center gap-1" suppressHydrationWarning>
                  <Clock size={11} />
                  {new Date(session.opened_at).toLocaleTimeString("es-PY", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
          {sessionOpen && (
            <Button
              variant="danger-soft"
              isIconOnly
              size="sm"
              onPress={() => setConfirmCloseOpen(true)}
              isDisabled={actionPending}
              aria-label="Cerrar mesa"
            >
              <DoorClosed size={16} />
            </Button>
          )}
        </div>

        {sessionOpen && (
          <>
            <SearchField
              value={search}
              onChange={setSearch}
              aria-label="Buscar producto"
              className="mt-3"
              isDisabled={billLocked}
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
          </>
        )}
      </header>

      <div className="flex-1 space-y-4 p-3 pb-28 sm:p-4">
        {(submittedOrders.length > 0 || pendingOrders.length > 0) && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ya enviado ({submittedOrders.length + pendingOrders.length})
            </h2>
            {submittedOrders.map((o) => (
              <Card key={o.id} variant="default">
                <Card.Content className="!p-3">
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
                </Card.Content>
              </Card>
            ))}
            {pendingOrders.map((o) => (
              <Card key={o.tempId} variant="default" className="opacity-70">
                <Card.Content className="!p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700">
                      Enviando · {o.customer_name}
                    </span>
                    <Chip size="sm" variant="soft" color="accent">
                      Pendiente
                    </Chip>
                  </div>
                  <ul className="space-y-1">
                    {o.items.map((it, idx) => (
                      <li
                        key={idx}
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
                </Card.Content>
              </Card>
            ))}
          </section>
        )}

        {sessionOpen && !billLocked && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Agregar al pedido
            </h2>
            {filteredProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Sin productos.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredProducts.map((p) => (
                  <ProductGridCard
                    key={p.id}
                    product={{
                      id: p.id,
                      name: p.name,
                      description: p.description,
                      effective_price: p.effective_price,
                      image_url: p.image_url,
                    }}
                    draftQty={draftQtyMap.get(p.id) ?? 0}
                    onOpen={() => setOpenProduct(p)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {billLocked && (
          <StaffAlert
            status="warning"
            title="Cuenta solicitada"
            description="El cliente pidió la cuenta. No se pueden agregar más items."
          />
        )}

        {sessionOpen && (
          <div className="flex items-baseline justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
            <span className="text-sm text-neutral-500">Total mesa</span>
            <span className="text-lg font-bold">
              ₲ {grandTotal.toLocaleString("es-PY")}
            </span>
          </div>
        )}

        {error && <StaffAlert status="danger" description={error} />}
      </div>

      {/* Floating "Ver pedido" button */}
      {sessionOpen && !billLocked && lines.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-20">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onPress={() => setCartOpen(true)}
            className="shadow-lg"
          >
            <ShoppingBag size={16} />
            <span className="flex-1 text-left">
              Ver pedido · {totalQty} {totalQty === 1 ? "item" : "items"}
            </span>
            <span className="tabular-nums">
              ₲ {totalDraft.toLocaleString("es-PY")}
            </span>
          </Button>
        </div>
      )}

      {/* Pending kitchen send shortcut when sheet not visible — none, sheet has it */}

      {/* Cart Drawer */}
      <CartSheet
        isOpen={cartOpen}
        onOpenChange={setCartOpen}
        lines={lines}
        total={totalDraft}
        setQty={setQty}
        removeLine={removeLine}
        onSubmit={handleSendToKitchen}
        pending={isPending}
      />

      {/* Product modal */}
      <StaffProductModal
        product={openProduct}
        onClose={() => setOpenProduct(null)}
        onAdd={(mods, qty, note) => {
          if (!openProduct) return;
          const o = overrideMap.get(openProduct.id);
          const effective = o?.price_override ?? openProduct.price;
          addProductWithMods(
            { ...openProduct, effective_price: effective },
            mods,
            qty,
            note
          );
        }}
      />

      {/* Open table modal */}
      <Modal.Backdrop
        isOpen={!sessionOpen}
        onOpenChange={(open) => {
          if (!open) router.push(`/staff/${restaurantSlug}/${branchSlug}`);
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.Header>
              <Modal.Heading>Abrir {table.label}</Modal.Heading>
              {table.capacity && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  Cap. {table.capacity}
                </p>
              )}
            </Modal.Header>
            <Modal.Body className="space-y-3">
              <TextField
                isRequired
                value={openName}
                onChange={setOpenName}
                autoFocus
                className="w-full"
              >
                <Label>Cliente / referencia</Label>
                <Input placeholder="Sr. Pérez · Mesa 5" />
              </TextField>
              <NumberField
                value={openParty}
                onChange={(n) => setOpenParty(n)}
                minValue={1}
                step={1}
                aria-label="Comensales"
                className="w-full"
              >
                <Label>Comensales</Label>
                <NumberField.Group>
                  <NumberField.DecrementButton />
                  <NumberField.Input placeholder="2" />
                  <NumberField.IncrementButton />
                </NumberField.Group>
              </NumberField>
              {openError && <StaffAlert status="danger" description={openError} />}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="ghost"
                type="button"
                onPress={() =>
                  router.push(`/staff/${restaurantSlug}/${branchSlug}`)
                }
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                isDisabled={openingSession || !openName.trim()}
                onPress={handleOpenTable}
              >
                Abrir mesa
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      {/* Close table confirmation */}
      <AlertDialog.Backdrop
        isOpen={confirmCloseOpen}
        onOpenChange={setConfirmCloseOpen}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Cerrar mesa</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              ¿Cerrar la sesión de {table.label}? La mesa quedará libre para el
              próximo cliente.
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="ghost">
                Cancelar
              </Button>
              <Button variant="danger" onPress={handleCloseTable}>
                <Send size={14} className="hidden" />
                Cerrar mesa
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
