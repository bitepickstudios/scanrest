"use client";

import { useState } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@heroui/react";
import { useCartStore } from "@/lib/stores/cart";
import { createClient } from "@/lib/supabase/client";
import { setActiveOrder } from "@/lib/active-order";

export default function CartSheet({
  restaurantSlug,
  tableId,
  mode,
  onClose,
}: {
  restaurantSlug: string;
  tableId: string | null;
  mode: string;
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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurant.id,
        table_id: tableId ?? null,
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
      }))
    );

    if (modifierRows.length > 0) {
      await supabase.from("order_item_modifiers").insert(modifierRows);
    }

    clear();
    setActiveOrder(restaurantSlug, order.id);
    router.push(`/${restaurantSlug}/order/${order.id}`);
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
            {items.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.product.name}</p>
                    {item.selectedModifiers.length > 0 && (
                      <p className="mt-0.5 text-xs text-neutral-400">
                        {item.selectedModifiers.map((m) => m.name).join(", ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="mt-0.5 text-xs italic text-neutral-400">
                        &quot;{item.note}&quot;
                      </p>
                    )}
                  </div>
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={() => removeItem(item.key)}
                    className="text-neutral-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1">
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => updateQuantity(item.key, item.quantity - 1)}
                    >
                      <Minus size={14} />
                    </Button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      onPress={() => updateQuantity(item.key, item.quantity + 1)}
                    >
                      <Plus size={14} />
                    </Button>
                  </div>
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
            ))}
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
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
              isDisabled={loading || !name.trim() || !phone.trim()}
              className="flex-1 rounded-2xl py-4 h-auto font-semibold"
            >
              {loading ? "Enviando..." : "Confirmar pedido"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
