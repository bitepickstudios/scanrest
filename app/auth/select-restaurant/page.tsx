import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, Card } from "@heroui/react";
import { ChevronRight, Plus, Store } from "lucide-react";
import { listOwnedRestaurants } from "@/lib/current-restaurant";

async function selectAction(formData: FormData) {
  "use server";
  const slug = formData.get("slug") as string;
  redirect(`/admin/${slug}`);
}

export default async function SelectRestaurantPage() {
  const { restaurants } = await listOwnedRestaurants();

  if (restaurants.length === 0) redirect("/auth/onboarding");
  if (restaurants.length === 1) redirect(`/admin/${restaurants[0].slug}`);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            Elegí tu local
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Tenés {restaurants.length} locales asociados a tu cuenta.
          </p>
        </div>

        <div className="space-y-2">
          {restaurants.map((r) => (
            <form key={r.id} action={selectAction}>
              <input type="hidden" name="slug" value={r.slug} />
              <button
                type="submit"
                className="block w-full text-left"
              >
                <Card
                  variant="default"
                  className="transition-all hover:border-neutral-300 hover:shadow-md"
                >
                  <Card.Content className="!flex !flex-row items-center gap-3 !p-4">
                    <Avatar size="md" className="shrink-0">
                      {r.logo_url ? (
                        <Avatar.Image src={r.logo_url} alt={r.name} />
                      ) : null}
                      <Avatar.Fallback className="bg-neutral-100 text-neutral-500">
                        <Store size={18} />
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">
                        {r.name}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        /{r.slug} ·{" "}
                        {r.mode === "table" ? "Mesas" : "Food court"}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-neutral-400" />
                  </Card.Content>
                </Card>
              </button>
            </form>
          ))}

          <Link href="/auth/onboarding" className="block">
            <Card
              variant="default"
              className="border-dashed transition-all hover:border-neutral-400 hover:shadow-md"
            >
              <Card.Content className="!flex !flex-row items-center gap-3 !p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                  <Plus size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    Crear otro restaurante
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    Nueva marca, menú y QRs propios
                  </p>
                </div>
                <ChevronRight size={16} className="text-neutral-400" />
              </Card.Content>
            </Card>
          </Link>
        </div>

      </div>
    </div>
  );
}
