"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { createClient } from "@/lib/supabase/client";
import { useOrderNotifications } from "@/lib/stores/order-notifications";

export default function OrdersRealtimeNotifier({
  restaurantId,
  restaurantSlug,
  defaultBranchSlug,
}: {
  restaurantId: string;
  restaurantSlug: string;
  defaultBranchSlug?: string;
}) {
  const router = useRouter();
  const push = useOrderNotifications((s) => s.push);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-orders:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const order = payload.new as {
            id: string;
            order_number: number;
            customer_name: string | null;
            table_id: string | null;
            source: string | null;
          };
          push({
            id: order.id,
            orderNumber: order.order_number,
            customerName: order.customer_name,
            source: order.source,
            createdAt: new Date().toISOString(),
          });
          sileo.success({
            title: `Nuevo pedido #${order.order_number}`,
            description: [
              order.customer_name ?? "Sin nombre",
              order.source === "waiter" ? "vía mozo" : "vía cliente",
            ]
              .filter(Boolean)
              .join(" · "),
            duration: 6000,
            button: defaultBranchSlug
              ? {
                  title: "Ver",
                  onClick: () => {
                    router.push(
                      `/admin/${restaurantSlug}/${defaultBranchSlug}/orders`
                    );
                  },
                }
              : undefined,
          });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, restaurantSlug, defaultBranchSlug, push, router]);

  return null;
}
