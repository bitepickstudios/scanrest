import { Star } from "lucide-react";
import { Avatar, Card } from "@heroui/react";
import { getRestaurantWithBranch } from "@/lib/current-restaurant";
import ReviewsPagination from "@/components/admin/ReviewsPagination";

const PAGE_SIZE = 10;

function relativeDate(input: string): string {
  const d = new Date(input);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hace instantes";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? "" : "s"}`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `hace ${weeks} sem`;
  }
  return d.toLocaleDateString("es-PY");
}

function initials(name: string | null): string {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ restaurantSlug: string; branchSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { restaurantSlug, branchSlug } = await params;
  const sp = await searchParams;
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(pageParam) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { supabase, branch } = await getRestaurantWithBranch(
    restaurantSlug,
    branchSlug
  );

  const [pageRes, statsRes] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, customer_name, rating, comment, created_at", {
        count: "exact",
      })
      .eq("branch_id", branch.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("reviews")
      .select("rating")
      .eq("branch_id", branch.id),
  ]);

  const list = pageRes.data ?? [];
  const total = pageRes.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allRatings = (statsRes.data ?? []).map((r) => r.rating as number);
  const avg =
    allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r, 0) / allRatings.length
      : null;
  const byStars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allRatings.filter((r) => r === star).length,
  }));

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">Reseñas</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {total} reseña{total === 1 ? "" : "s"} en total
      </p>

      {allRatings.length > 0 && (
        <Card variant="default" className="mt-6">
          <Card.Content className="!flex !flex-col gap-6 !p-6 sm:!flex-row sm:items-center">
            <div className="text-center">
              <p className="text-5xl font-black text-neutral-900">
                {avg!.toFixed(1)}
              </p>
              <div className="mt-1 flex justify-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={
                      s <= Math.round(avg!)
                        ? "fill-amber-400 text-amber-400"
                        : "text-neutral-200"
                    }
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-400">
                {allRatings.length} reseñas
              </p>
            </div>

            <div className="flex-1 space-y-1.5">
              {byStars.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-3 text-right text-xs text-neutral-500">
                    {star}
                  </span>
                  <Star
                    size={10}
                    className="fill-amber-400 text-amber-400"
                  />
                  <div className="flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-1.5 rounded-full bg-amber-400"
                      style={{
                        width:
                          allRatings.length > 0
                            ? `${(count / allRatings.length) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <span className="w-4 text-xs text-neutral-400">{count}</span>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {list.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-200">
            <p className="text-sm text-neutral-400">
              Aún no hay reseñas. Aparecerán aquí cuando los clientes las dejen.
            </p>
          </div>
        ) : (
          list.map((review) => {
            const name = (review.customer_name as string | null) ?? "Anónimo";
            return (
              <Card key={review.id as string} variant="default">
                <Card.Content className="!p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 shrink-0">
                      <Avatar.Fallback className="bg-neutral-900 text-sm font-bold text-white">
                        {initials(name)}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          {name}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {relativeDate(review.created_at as string)}
                        </p>
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            className={
                              s <= (review.rating as number)
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-200"
                            }
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                          {review.comment as string}
                        </p>
                      )}
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="mt-6">
          <ReviewsPagination
            page={page}
            totalPages={totalPages}
            itemsPerPage={PAGE_SIZE}
            totalItems={total}
          />
        </div>
      )}
    </div>
  );
}
