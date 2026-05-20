import NavTabs from "@/components/admin/NavTabs";
import { negocioTabs } from "@/components/admin/section-tabs-config";

export default async function ProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">Negocio</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Datos del local, sucursales y equipo.
      </p>
      <div className="mt-6 mb-6">
        <NavTabs tabs={negocioTabs(restaurantSlug)} />
      </div>
      {children}
    </div>
  );
}
