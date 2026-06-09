"use client";

import { Star, MapPin, UtensilsCrossed, Store } from "lucide-react";

export default function OnboardingPreview({
  name,
  description,
  mode,
  address,
}: {
  name: string;
  description: string;
  mode: "table" | "foodcourt" | null;
  address: string;
}) {
  const displayName = name.trim() || "Tu restaurante";
  const displayDescription = description.trim() || "Una breve descripción aparecerá acá.";
  const modeLabel = mode === "table" ? "Pedido en mesa" : mode === "foodcourt" ? "Retiro en mostrador" : null;
  const ModeIcon = mode === "foodcourt" ? Store : UtensilsCrossed;

  return (
    <div className="sticky top-16">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-400">
        Vista previa del menú
      </p>

      {/* Phone chrome */}
      <div className="relative mx-auto w-full max-w-[320px]">
        <div className="rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl">
          <div className="overflow-hidden rounded-[1.75rem] bg-white">
            {/* Status bar */}
            <div className="flex h-7 items-center justify-between bg-white px-5 text-[10px] font-semibold text-neutral-700">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
              </div>
            </div>

            {/* Cover */}
            <div className="relative h-24 bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(190,210,180,0.5),_transparent_50%)]" />
            </div>

            {/* Header */}
            <div className="relative -mt-7 px-4">
              <div className="flex items-end gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-white bg-white shadow-md">
                  <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-neutral-900">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-2.5">
                <h2 className="line-clamp-1 font-[family-name:var(--font-heading)] text-base font-bold text-neutral-900">
                  {displayName}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500">
                  {displayDescription}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  <Star size={9} className="fill-amber-500 text-amber-500" />
                  5.0
                </span>
                {modeLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    <ModeIcon size={9} />
                    {modeLabel}
                  </span>
                )}
                {address.trim() && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                    <MapPin size={9} />
                    <span className="max-w-[90px] truncate">{address.trim()}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Categories pill scroll */}
            <div className="mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
              <span className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white">
                Destacados
              </span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-500">
                Entradas
              </span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-500">
                Principales
              </span>
              <span className="shrink-0 rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium text-neutral-500">
                Bebidas
              </span>
            </div>

            {/* Product cards skeleton */}
            <div className="space-y-2 px-4 pb-4 pt-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2"
                >
                  <div className="h-12 w-12 shrink-0 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100" />
                  <div className="min-w-0 flex-1">
                    <div className="h-2 w-3/4 rounded bg-neutral-200" />
                    <div className="mt-1.5 h-1.5 w-1/2 rounded bg-neutral-100" />
                    <div className="mt-2 h-2 w-12 rounded bg-neutral-900" />
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-base font-bold text-white">
                    +
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        Así verán tu local en el celular
      </p>
    </div>
  );
}
