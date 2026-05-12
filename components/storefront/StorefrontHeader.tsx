import { MapPin, Mail, Star } from "lucide-react";
import { Avatar, Chip } from "@heroui/react";
import type { Restaurant } from "@/lib/types";
import {
  WhatsappIcon,
  InstagramIcon,
  FacebookIcon,
  TiktokIcon,
} from "@/components/icons/SocialIcons";

export default function StorefrontHeader({
  restaurant,
  avgRating,
  reviewCount,
}: {
  restaurant: Restaurant;
  avgRating: number | null;
  reviewCount: number;
}) {
  const initials = restaurant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white">
      {/* Cover */}
      <div className="relative h-44 w-full bg-gradient-to-br from-neutral-200 to-neutral-300">
        {restaurant.cover_url && (
          <img
            src={restaurant.cover_url}
            alt={`${restaurant.name} cover`}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute right-3 top-3">
          <Chip variant="primary" size="sm" className="bg-black/60 text-white backdrop-blur-sm">
            {restaurant.mode === "table" ? "🍽 Pedido a mesa" : "🏃 Retiro en mostrador"}
          </Chip>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-8 mb-3 flex items-end gap-3">
          <Avatar size="lg" className="h-16 w-16 shrink-0 rounded-2xl ring-2 ring-white shadow-md">
            {restaurant.logo_url && (
              <Avatar.Image
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="rounded-2xl object-cover"
              />
            )}
            <Avatar.Fallback className="rounded-2xl bg-neutral-100 text-2xl font-bold text-neutral-400">
              {initials}
            </Avatar.Fallback>
          </Avatar>

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

        <div className="mt-3 flex flex-wrap gap-2">
          {restaurant.whatsapp && (
            <a
              href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Chip variant="soft" size="sm" className="bg-green-50 text-green-600">
                <WhatsappIcon size={12} /> WhatsApp
              </Chip>
            </a>
          )}
          {restaurant.instagram && (
            <a
              href={`https://instagram.com/${restaurant.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Chip variant="soft" size="sm" className="bg-pink-50 text-pink-600">
                <InstagramIcon size={12} /> Instagram
              </Chip>
            </a>
          )}
          {restaurant.facebook && (
            <a
              href={`https://facebook.com/${restaurant.facebook.replace(/^facebook\.com\//, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Chip variant="soft" size="sm" className="bg-blue-50 text-blue-600">
                <FacebookIcon size={12} /> Facebook
              </Chip>
            </a>
          )}
          {restaurant.tiktok && (
            <a
              href={`https://tiktok.com/@${restaurant.tiktok.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Chip variant="soft" size="sm" className="bg-neutral-900 text-white">
                <TiktokIcon size={12} /> TikTok
              </Chip>
            </a>
          )}
          {restaurant.email && (
            <a href={`mailto:${restaurant.email}`}>
              <Chip variant="soft" size="sm" className="bg-neutral-100 text-neutral-600">
                <Mail size={12} /> Email
              </Chip>
            </a>
          )}
          {restaurant.address && (
            <Chip variant="soft" size="sm" className="bg-neutral-100 text-neutral-500">
              <MapPin size={12} /> {restaurant.address}
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}
