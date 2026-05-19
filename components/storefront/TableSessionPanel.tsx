"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Chip } from "@heroui/react";
import { Receipt } from "lucide-react";
import { getTableSessionId } from "@/lib/table-session";
import { requestBill } from "@/lib/actions/table-sessions";

type SessionRow = {
  id: string;
  status: string;
  bill_requested_at: string | null;
  customer_name: string | null;
};

type OrderRow = {
  id: string;
  order_number: number;
  status: string;
  source: string;
  customer_name: string;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
};

export default function TableSessionPanel({
  restaurantSlug,
  tableId,
}: {
  restaurantSlug: string;
  tableId: string;
}) {
  const supabase = createClient();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = getTableSessionId(restaurantSlug, tableId);
    if (!sessionId) return;

    let cancelled = false;

    async function load() {
      const { data: sess } = await supabase
        .from("table_sessions")
        .select("id, status, bill_requested_at, customer_name")
        .eq("id", sessionId!)
        .maybeSingle();
      if (cancelled) return;
      if (!sess || sess.status === "closed") {
        setSession(null);
        setOrders([]);
        return;
      }
      setSession(sess as SessionRow);

      const { data: ord } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, source, customer_name, order_items(id, product_name, quantity, unit_price)"
        )
        .eq("session_id", sessionId!)
        .order("created_at", { ascending: true });
      if (!cancelled) setOrders((ord ?? []) as OrderRow[]);
    }

    load();

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "table_sessions", filter: `id=eq.${sessionId}` },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `session_id=eq.${sessionId}` },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [restaurantSlug, tableId, supabase]);

  if (!session) return null;

  const total = orders.reduce(
    (sum, o) => sum + o.order_items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    0
  );
  const billed = !!session.bill_requested_at;

  function handleRequestBill() {
    setError(null);
    startTransition(async () => {
      try {
        await requestBill(session!.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al pedir cuenta.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-left shadow-sm"
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            Tu cuenta
          </p>
          <p className="text-sm font-bold text-[var(--foreground)]">
            {orders.length} pedido{orders.length === 1 ? "" : "s"} · ₲{" "}
            {total.toLocaleString("es-PY")}
          </p>
        </div>
        {billed ? (
          <Chip size="sm" color="warning" variant="soft">
            Cuenta pedida
          </Chip>
        ) : (
          <Chip size="sm" variant="soft">
            Ver
          </Chip>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tu cuenta</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-500"
              >
                Cerrar
              </button>
            </div>
            {orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                Sin pedidos aún.
              </p>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-neutral-200 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        #{o.order_number} · {o.source === "waiter" ? "Mozo" : "QR"} ·{" "}
                        {o.customer_name}
                      </span>
                      <Chip size="sm" variant="soft">
                        {o.status}
                      </Chip>
                    </div>
                    <ul className="space-y-1">
                      {o.order_items.map((it) => (
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
              </div>
            )}
            <div className="mt-4 flex items-baseline justify-between border-t border-neutral-200 pt-3">
              <span className="text-sm text-neutral-500">Total</span>
              <span className="text-lg font-bold">
                ₲ {total.toLocaleString("es-PY")}
              </span>
            </div>
            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {billed ? (
              <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Cuenta solicitada. El mozo viene a cobrar.
              </div>
            ) : (
              <Button
                variant="primary"
                fullWidth
                isDisabled={pending || orders.length === 0}
                onPress={handleRequestBill}
                className="mt-4"
              >
                <Receipt size={16} />
                Pedir cuenta
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
