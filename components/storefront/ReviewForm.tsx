"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ReviewForm({
  restaurantId,
  customerName,
}: {
  restaurantId: string;
  customerName: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("reviews").insert({
      restaurant_id: restaurantId,
      customer_name: customerName,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <p className="text-2xl">🙏</p>
        <p className="mt-2 font-semibold">¡Gracias por tu reseña!</p>
        <p className="mt-1 text-sm text-neutral-400">
          Tu opinión ayuda a mejorar el servicio.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-neutral-800">
        ¿Cómo fue tu experiencia?
      </h3>
      <p className="mt-0.5 text-xs text-neutral-400">
        Dejá una reseña del restaurante
      </p>

      {/* Stars */}
      <div className="mt-4 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={36}
              className={
                star <= (hovered || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-neutral-200"
              }
            />
          </button>
        ))}
      </div>

      {rating > 0 && (
        <div className="mt-4 space-y-3">
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contanos tu experiencia (opcional)..."
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-neutral-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar reseña"}
          </button>
        </div>
      )}
    </div>
  );
}
