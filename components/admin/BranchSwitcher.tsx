"use client";

import { useRouter, usePathname } from "next/navigation";
import { MapPin, Settings } from "lucide-react";
import { ListBox, Select } from "@heroui/react";
import type { Key } from "react";

export type BranchLite = {
  id: string;
  slug: string;
  name: string;
  is_default: boolean;
  active: boolean;
};

const MANAGE_KEY = "__manage";

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

  function handleChange(value: Key | Key[] | null) {
    const k = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
    if (!k) return;
    if (k === MANAGE_KEY) {
      router.push(`/admin/${restaurantSlug}/profile/sucursales`);
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
        onClick={() => router.push(`/admin/${restaurantSlug}/profile/sucursales`)}
        className="flex w-full items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-2.5 py-1.5 text-left text-xs font-medium text-neutral-500 hover:border-neutral-400"
      >
        <MapPin size={12} />
        Crear sucursal
      </button>
    );
  }

  return (
    <Select
      fullWidth
      value={current.id}
      onChange={handleChange}
      placeholder="Sucursal"
      aria-label="Sucursal activa"
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox aria-label="Sucursales">
          {active.map((b) => (
            <ListBox.Item key={b.id} id={b.id} textValue={b.name}>
              {b.name}
              {b.is_default ? " · principal" : ""}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
          <ListBox.Item id={MANAGE_KEY} textValue="Gestionar sucursales">
            <Settings size={12} className="mr-1.5 inline" />
            Gestionar sucursales
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
