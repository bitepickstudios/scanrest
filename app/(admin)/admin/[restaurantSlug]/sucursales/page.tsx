import Link from "next/link";
import { Plus, MapPin, ChevronRight } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import {
  getRestaurantBySlug,
  listBranchesForRestaurant,
} from "@/lib/current-restaurant";

export default async function SucursalesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>;
}) {
  const { restaurantSlug } = await params;
  const { restaurant } = await getRestaurantBySlug(
    restaurantSlug,
    "id, name, slug"
  );
  const branches = await listBranchesForRestaurant(restaurant.id);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">Sucursales</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gestioná los locales de {restaurant.name}. Cada sucursal tiene sus
            propias mesas, mozos y pedidos.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {branches.map((b) => (
          <Link
            key={b.id}
            href={`/admin/${restaurant.slug}/${b.slug}`}
            className="block"
          >
            <Card
              variant="default"
              className="transition-all hover:border-neutral-300 hover:shadow-md"
            >
              <Card.Content className="!flex !flex-row items-center gap-3 !p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {b.name}
                    </p>
                    {b.is_default && (
                      <Chip size="sm" variant="soft">
                        Principal
                      </Chip>
                    )}
                    {!b.active && (
                      <Chip size="sm" variant="soft" color="warning">
                        Inactiva
                      </Chip>
                    )}
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    /{b.slug}
                    {b.address ? ` · ${b.address}` : ""}
                  </p>
                </div>
                <ChevronRight size={16} className="text-neutral-400" />
              </Card.Content>
            </Card>
          </Link>
        ))}

        <Card
          variant="default"
          className="border-dashed transition-all hover:border-neutral-400"
        >
          <Card.Content className="!flex !flex-row items-center gap-3 !p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
              <Plus size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">
                Crear sucursal
              </p>
              <p className="truncate text-xs text-neutral-500">
                Disponible en Fase 3 (gestor de sucursales)
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
