import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, MapPin } from "lucide-react";
import { Card } from "@heroui/react";
import { createClient } from "@/lib/supabase/server";

export default async function StorefrontRootPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table: tableId } = await searchParams;

  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, slug, logo_url")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!restaurant) notFound();

  const { data: branches } = await supabase
    .from("branches")
    .select("slug, name, address, is_default")
    .eq("restaurant_id", restaurant.id)
    .eq("active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  const list = branches ?? [];
  if (list.length === 0) notFound();

  const qs = tableId ? `?table=${tableId}` : "";

  if (list.length === 1) {
    redirect(`/${slug}/${list[0].slug}${qs}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Elegí una sucursal para ver el menú.
          </p>
        </div>

        <div className="space-y-2">
          {list.map((b) => (
            <Link key={b.slug} href={`/${slug}/${b.slug}${qs}`}>
              <Card
                variant="default"
                className="transition-all hover:border-neutral-300 hover:shadow-md"
              >
                <Card.Content className="!flex !flex-row items-center gap-3 !p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {b.name}
                    </p>
                    {b.address && (
                      <p className="truncate text-xs text-neutral-500">
                        {b.address}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-neutral-400" />
                </Card.Content>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
