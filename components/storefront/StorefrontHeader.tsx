import { MapPin, Phone, Mail, Star, ExternalLink } from "lucide-react";
import type { Restaurant } from "@/lib/types";

export default function StorefrontHeader({
  restaurant,
  avgRating,
  reviewCount,
}: {
  restaurant: Restaurant;
  avgRating: number | null;
  reviewCount: number;
}) {
  return (
    <div className="bg-white">
      {/* Cover */}
      <div className="relative h-44 w-full bg-neutral-200">
        {restaurant.cover_url && (
          <img
            src={restaurant.cover_url}
            alt="cover"
            className="h-full w-full object-cover"
          />
        )}
        {/* Mode badge */}
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {restaurant.mode === "table" ? "🍽 Pedido a mesa" : "🏃 Retiro en mostrador"}
        </span>
      </div>

      {/* Logo + info */}
      <div className="px-4 pb-4">
        {/* Logo */}
        <div className="-mt-8 mb-3 flex items-end gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-neutral-100 shadow-md">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-neutral-300">
                {restaurant.name[0]}
              </div>
            )}
          </div>
          {/* Stars */}
          {avgRating !== null && (
            <div className="mb-1 flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-neutral-400">({reviewCount})</span>
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold text-neutral-900">{restaurant.name}</h1>

        {restaurant.description && (
          <p className="mt-1 text-sm leading-relaxed text-neutral-500">
            {restaurant.description}
          </p>
        )}

        {/* Social links */}
        <div className="mt-3 flex flex-wrap gap-2">
          {restaurant.whatsapp && (
            <a
              href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700"
            >
              <Phone size={12} /> WhatsApp
            </a>
          )}
          {restaurant.instagram && (
            <a
              href={`https://instagram.com/${restaurant.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700"
            >
              <ExternalLink size={12} /> Instagram
            </a>
          )}
          {restaurant.facebook && (
            <a
              href={`https://facebook.com/${restaurant.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
            >
              <ExternalLink size={12} /> Facebook
            </a>
          )}
          {restaurant.email && (
            <a
              href={`mailto:${restaurant.email}`}
              className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600"
            >
              <Mail size={12} /> Email
            </a>
          )}
          {restaurant.address && (
            <span className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-neutral-500">
              <MapPin size={12} /> {restaurant.address}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
