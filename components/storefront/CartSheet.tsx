"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Trash2, AlertCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { useCartStore } from "@/lib/stores/cart";
import { createClient } from "@/lib/supabase/client";
import { setActiveOrder } from "@/lib/active-order";
import { getCustomerIdentity, setCustomerIdentity } from "@/lib/customer-identity";
import { getTableSessionId, setTableSessionId } from "@/lib/table-session";
import { ensureTableSession } from "@/lib/actions/table-sessions";
import type { Product, ModifierGroup, Modifier } from "@/lib/types";
import ProductModal from "./ProductModal";
import QuantityStepper from "./QuantityStepper";
import ProductCard from "./ProductCard";

type ProductFull = Product & {
  modifier_groups: (ModifierGroup & { modifiers: Modifier[] })[];
};

export default function CartSheet({
  restaurantSlug,
  branchSlug,
  tableId,
  mode,
  table,
  allProducts,
  onClose,
}: {
  restaurantSlug: string;
  branchSlug?: string;
  tableId: string | null;
  mode: string;
  table: { number: number; label: string | null } | null;
  allProducts: ProductFull[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalPrice, clear } = useCartStore();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ci, setCi] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    key: string;
    product: ProductFull;
    quantity: number;
    note: string;
    modifierIds: string[];
  } | null>(null);
  const [quickAdd, setQuickAdd] = useState<ProductFull | null>(null);

  const productMap = useMemo(() => {
    const map = new Map<string, ProductFull>();
    allProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [allProducts]);

  const inCartIds = useMemo(
    () => new Set(items.map((i) => i.product.id)),
    [items]
  );
  const suggestions = useMemo(
    () => allProducts.filter((p) => !inCartIds.has(p.id)).slice(0, 12),
    [allProducts, inCartIds]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const id = getCustomerIdentity(restaurantSlug);
    if (id) {
      setName(id.name);
      setPhone(id.phone);
      if (id.ci) setCi(id.ci);
    }
  }, [restaurantSlug]);

  function startEdit(itemKey: string) {
    const item = items.find((i) => i.key === itemKey);
    if (!item) return;
    const full = productMap.get(item.product.id);
    if (!full) return;
    setEditing({
      key: item.key,
      product: full,
      quantity: item.quantity,
      note: item.note,
      modifierIds: item.selectedModifiers.map((m) => m.id),
    });
  }


  async function handleConfirmOrder() {
    if (!name.trim() || !phone.trim()) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", restaurantSlug)
      .single();

    if (!restaurant) {
      setError("No se encontró el restaurante.");
      setLoading(false);
      return;
    }

    let resolvedBranchId: string | null = null;
    let resolvedBranchSlug: string | null = branchSlug ?? null;
    if (branchSlug) {
      const { data: branch } = await supabase
        .from("branches")
        .select("id, slug")
        .eq("restaurant_id", restaurant.id)
        .eq("slug", branchSlug)
        .single();
      resolvedBranchId = branch?.id ?? null;
    } else {
      const { data: branch } = await supabase
        .from("branches")
        .select("id, slug")
        .eq("restaurant_id", restaurant.id)
        .eq("active", true)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .single();
      resolvedBranchId = branch?.id ?? null;
      resolvedBranchSlug = branch?.slug ?? null;
    }

    if (!resolvedBranchId) {
      setError("No se encontró la sucursal.");
      setLoading(false);
      return;
    }

    let sessionId: string | null = null;
    if (mode === "table" && tableId) {
      const cached = getTableSessionId(restaurantSlug, tableId);
      if (cached) {
        const { data: stillOpen } = await supabase
          .from("table_sessions")
          .select("id, bill_requested_at")
          .eq("id", cached)
          .neq("status", "closed")
          .maybeSingle();
        if (stillOpen) {
          if (stillOpen.bill_requested_at) {
            setError("La cuenta ya fue solicitada. Esperá al mozo para cerrar la mesa.");
            setLoading(false);
            return;
          }
          sessionId = cached;
        }
      }
      if (!sessionId) {
        try {
          sessionId = await ensureTableSession({
            restaurantId: restaurant.id,
            branchId: resolvedBranchId,
            tableId,
            customerName: name.trim(),
          });
          setTableSessionId(restaurantSlug, tableId, sessionId);
        } catch {
          sessionId = null;
        }
      }
    }

    setCustomerIdentity(restaurantSlug, {
      name: name.trim(),
      phone: phone.trim(),
      ci: ci.trim() || undefined,
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        branch_id: resolvedBranchId,
        table_id: tableId ?? null,
        session_id: sessionId,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_ci: ci.trim() || null,
        mode,
        notes: orderNote.trim() || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      setError(orderError?.message ?? "Error al crear el pedido.");
      setLoading(false);
      return;
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      notes: item.note || null,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems)
      .select();

    if (itemsError || !insertedItems) {
      setError(itemsError?.message ?? "Error al guardar los items.");
      setLoading(false);
      return;
    }

    const modifierRows = items.flatMap((item, idx) =>
      item.selectedModifiers.map((mod) => ({
        order_item_id: insertedItems[idx].id,
        modifier_name: mod.name,
        price_delta: mod.price_delta,
        quantity: mod.quantity ?? 1,
      }))
    );

    if (modifierRows.length > 0) {
      await supabase.from("order_item_modifiers").insert(modifierRows);
    }

    clear();
    setActiveOrder(restaurantSlug, order.id);
    const branchPath = resolvedBranchSlug ?? "";
    router.push(`/${restaurantSlug}/${branchPath}/order/${order.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white animate-[slide-up_0.22s_cubic-bezier(0.16,1,0.3,1)]">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4">
        <h2 className="text-lg font-bold">
          {step === "cart" ? "Tu pedido" : "Tus datos"}
        </h2>
        <Button isIconOnly variant="ghost" size="sm" onPress={onClose}>
          <X size={20} className="text-neutral-500" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step === "cart" ? (
          <div className="px-4 py-4 space-y-3">
            {items.map((item) => {
              const full = productMap.get(item.product.id);
              const hasVariants =
                (full?.modifier_groups?.length ?? 0) > 0;
              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-neutral-100 bg-neutral-50 p-3"
                >
                  <div className="flex items-start gap-3">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 shrink-0 rounded-xl bg-neutral-200" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{item.product.name}</p>
                      {item.product.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-400">
                          {item.product.description}
                        </p>
                      )}
                      {item.selectedModifiers.length > 0 && (
                        <p className="mt-1 text-xs text-neutral-500">
                          {item.selectedModifiers.map((m) => m.name).join(", ")}
                        </p>
                      )}
                      {item.note && (
                        <p className="mt-0.5 text-xs italic text-neutral-400">
                          &quot;{item.note}&quot;
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {hasVariants && (
                        <Button
                          isIconOnly
                          variant="ghost"
                          size="sm"
                          onPress={() => startEdit(item.key)}
                          className="text-neutral-400 hover:text-neutral-900"
                          aria-label="Editar"
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      <Button
                        isIconOnly
                        variant="ghost"
                        size="sm"
                        onPress={() => removeItem(item.key)}
                        className="text-neutral-300 hover:text-red-500"
                        aria-label="Quitar"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      onDecrement={() => updateQuantity(item.key, item.quantity - 1)}
                      onIncrement={() => updateQuantity(item.key, item.quantity + 1)}
                    />
                    <p className="text-sm font-bold">
                      Gs.{" "}
                      {(
                        (item.product.price +
                          item.selectedModifiers.reduce(
                            (s, m) => s + m.price_delta,
                            0
                          )) *
                        item.quantity
                      ).toLocaleString("es-PY")}
                    </p>
                  </div>
                </div>
              );
            })}

            {suggestions.length > 0 && (
              <div className="-mx-4 pt-2">
                <h3 className="px-4 text-sm font-bold text-neutral-800">
                  También te puede gustar
                </h3>
                <div className="mt-2 flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-3">
                  {suggestions.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      compact
                      onOpen={() => setQuickAdd(p)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {mode === "table" && table && (
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] font-bold">
                  {table.number}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Pedido para</p>
                  <p className="text-sm font-bold text-[var(--foreground)] truncate">
                    {table.label || `Mesa ${table.number}`}
                  </p>
                </div>
              </div>
            )}
            {mode === "table" && !table && (
              <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>No detectamos tu mesa. Volvé a escanear el QR de la mesa para que el mozo sepa adónde llevar el pedido.</p>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Nombre *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono *</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+595 9XX XXXXXX"
                type="tel"
                className="w-full rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                CI / RUC{" "}
                <span className="text-neutral-400 font-normal">(opcional, para factura)</span>
              </label>
              <Input
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                placeholder="12345678"
                className="w-full rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nota del pedido{" "}
                <span className="text-neutral-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Alguna indicación general..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-100 bg-white px-4 py-4 space-y-2">
        <div className="flex justify-between text-sm text-neutral-500 px-1">
          <span>Total</span>
          <span className="font-bold text-neutral-900">
            Gs. {totalPrice().toLocaleString("es-PY")}
          </span>
        </div>

        {step === "cart" ? (
          <Button
            variant="primary"
            onPress={() => setStep("checkout")}
            className="w-full rounded-2xl py-4 h-auto font-semibold"
          >
            Continuar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onPress={() => setStep("cart")}
              className="rounded-2xl px-5 py-4 h-auto"
            >
              Atrás
            </Button>
            <Button
              variant="primary"
              onPress={handleConfirmOrder}
              isDisabled={loading || !name.trim() || !phone.trim() || (mode === "table" && !table)}
              className="flex-1 rounded-2xl py-4 h-auto font-semibold"
            >
              {loading ? "Enviando..." : "Confirmar pedido"}
            </Button>
          </div>
        )}
      </div>

      {editing && (
        <ProductModal
          product={editing.product}
          editKey={editing.key}
          initialQuantity={editing.quantity}
          initialNote={editing.note}
          initialModifierIds={editing.modifierIds}
          onClose={() => setEditing(null)}
        />
      )}
      {quickAdd && (
        <ProductModal
          product={quickAdd}
          onClose={() => setQuickAdd(null)}
        />
      )}
    </div>
  );
}
