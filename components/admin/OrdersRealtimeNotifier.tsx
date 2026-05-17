"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { createClient } from "@/lib/supabase/client";
import { useOrderNotifications } from "@/lib/stores/order-notifications";

export default function OrdersRealtimeNotifier({
  branchId,
  restaurantSlug,
  branchSlug,
}: {
  branchId: string;
  restaurantSlug: string;
  branchSlug: string;
}) {
  const router = useRouter();
  const bump = useOrderNotifications((s) => s.bump);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-orders:${branchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `branch_id=eq.${branchId}`,
        },
        (payload) => {
          const order = payload.new as {
            id: string;
            order_number: number;
            customer_name: string | null;
            table_id: string | null;
            source: string | null;
          };
          bump();
          sileo.success({
            title: `Nuevo pedido #${order.order_number}`,
            description: [
              order.customer_name ?? "Sin nombre",
              order.source === "waiter" ? "vía mozo" : "vía cliente",
            ]
              .filter(Boolean)
              .join(" · "),
            duration: 6000,
            button: {
              title: "Ver",
              onClick: () => {
                router.push(
                  `/admin/${restaurantSlug}/${branchSlug}/orders`
                );
              },
            },
          });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, restaurantSlug, branchSlug, bump, router]);

  return null;
}
