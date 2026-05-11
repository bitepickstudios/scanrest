import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Store, UtensilsCrossed, Table2, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, mode")
    .eq("owner_id", user.id)
    .single();

  const [{ count: productCount }, { count: tableCount }, { count: orderCount }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurant!.id),
      supabase
        .from("tables")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurant!.id),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", restaurant!.id),
    ]);

  const cards = [
    {
      label: "Productos",
      value: productCount ?? 0,
      icon: UtensilsCrossed,
      href: "/dashboard/menu",
    },
    {
      label: "Mesas",
      value: tableCount ?? 0,
      icon: Table2,
      href: "/dashboard/tables",
    },
    {
      label: "Pedidos totales",
      value: orderCount ?? 0,
      icon: ClipboardList,
      href: "/dashboard/orders",
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">
        Bienvenido, {restaurant?.name}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Panel de administración · Modo:{" "}
        {restaurant?.mode === "table" ? "Restaurante con mesas" : "Food court"}
      </p>

      <div className="mt-8 grid grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-neutral-400">
              <Icon size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">
                {label}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-neutral-800">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center gap-2 text-neutral-400">
          <Store size={16} />
          <span className="text-xs font-medium uppercase tracking-wider">
            Accesos rápidos
          </span>
        </div>
        <div className="mt-3 flex gap-3">
          <Link
            href="/dashboard/profile"
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            Editar perfil del restaurante
          </Link>
          <Link
            href="/dashboard/menu"
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
          >
            Gestionar menú
          </Link>
        </div>
      </div>
    </div>
  );
}
