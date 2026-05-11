import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!restaurant) redirect("/auth/register");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });

  const list = reviews ?? [];
  const avg =
    list.length > 0
      ? list.reduce((s, r) => s + r.rating, 0) / list.length
      : null;

  const byStars = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: list.filter((r) => r.rating === star).length,
  }));

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-neutral-800">Reseñas</h1>

      {/* Summary */}
      {list.length > 0 && (
        <div className="mt-6 flex items-center gap-8 rounded-xl border border-neutral-200 bg-white p-5">
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
            <p className="mt-1 text-xs text-neutral-400">{list.length} reseñas</p>
          </div>

          <div className="flex-1 space-y-1.5">
            {byStars.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-right text-xs text-neutral-500">
                  {star}
                </span>
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <div className="flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-1.5 rounded-full bg-amber-400"
                    style={{
                      width:
                        list.length > 0
                          ? `${(count / list.length) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <span className="w-4 text-xs text-neutral-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="mt-6 space-y-3">
        {list.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-neutral-200">
            <p className="text-sm text-neutral-400">
              Aún no hay reseñas. Aparecerán aquí cuando los clientes las dejen.
            </p>
          </div>
        ) : (
          list.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{review.customer_name}</p>
                  <div className="mt-0.5 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={
                          s <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-200"
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="shrink-0 text-xs text-neutral-400">
                  {new Date(review.created_at).toLocaleDateString("es-PY")}
                </p>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-neutral-600">{review.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
