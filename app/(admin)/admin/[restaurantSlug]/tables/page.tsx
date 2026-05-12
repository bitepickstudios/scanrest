import TablesManager from "@/components/admin/TablesManager";
import { getRestaurantBySlug } from "@/lib/current-restaurant";

export default async function TablesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { supabase, restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id, slug, mode"
  );

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("number", { ascending: true });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 bg-white px-8 py-5">
        <h1 className="text-xl font-semibold text-neutral-800">
          {restaurant.mode === "table" ? "Mesas y QRs" : "QR del local"}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {restaurant.mode === "table"
            ? "Generá y descargá los QRs para pegar en cada mesa."
            : "Un solo QR para que los clientes hagan su pedido y retiren en el mostrador."}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <TablesManager
          tables={tables ?? []}
          restaurantSlug={restaurant.slug}
          mode={restaurant.mode as "table" | "foodcourt"}
        />
      </div>
    </div>
  );
}
