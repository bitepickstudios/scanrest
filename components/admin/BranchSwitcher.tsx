"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, MapPin, Settings } from "lucide-react";
import { Dropdown, Label } from "@heroui/react";

export type BranchLite = {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
  active: boolean;
};

export default function BranchSwitcher({
  restaurantSlug,
  branches,
  currentBranchSlug,
}: {
  restaurantSlug: string;
  branches: BranchLite[];
  currentBranchSlug?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const active = branches.filter((b) => b.active);
  const current =
    active.find((b) => b.slug === currentBranchSlug) ??
    active.find((b) => b.is_default) ??
    active[0];

  function handleAction(key: React.Key) {
    const k = String(key);
    if (k === "__manage") {
      router.push(`/admin/${restaurantSlug}/sucursales`);
      return;
    }
    const target = branches.find((b) => b.id === k);
    if (!target) return;

    const restBase = `/admin/${restaurantSlug}`;
    let newPath = `${restBase}/${target.slug}`;

    if (
      currentBranchSlug &&
      pathname.startsWith(`${restBase}/${currentBranchSlug}/`)
    ) {
      const tail = pathname.slice(`${restBase}/${currentBranchSlug}`.length);
      newPath = `${restBase}/${target.slug}${tail}`;
    }
    router.push(newPath);
  }

  if (!current) {
    return (
      <button
        type="button"
        onClick={() => router.push(`/admin/${restaurantSlug}/sucursales`)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1.5 text-left text-xs font-medium text-neutral-500 hover:border-neutral-400"
      >
        <MapPin size={12} />
        Crear sucursal
      </button>
    );
  }

  return (
    <Dropdown>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-neutral-700 hover:border-neutral-300"
      >
        <MapPin size={12} className="shrink-0 text-neutral-400" />
        <span className="flex-1 truncate">{current.name}</span>
        <ChevronDown size={12} className="text-neutral-400" />
      </button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={handleAction}>
          {active.map((b) => (
            <Dropdown.Item key={b.id} id={b.id} textValue={b.name}>
              <Label>
                {b.name}
                {b.is_default ? " · principal" : ""}
              </Label>
            </Dropdown.Item>
          ))}
          <Dropdown.Item id="__manage" textValue="Gestionar sucursales">
            <Label className="flex items-center gap-1.5">
              <Settings size={12} /> Gestionar sucursales
            </Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
