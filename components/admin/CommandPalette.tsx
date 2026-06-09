"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Modal, TextField, Input } from "@heroui/react";
import { Users, MapPin, Sparkles } from "lucide-react";
import {
  NAV_SECTIONS,
  buildHref,
  type NavItem,
} from "./sidebar-nav-config";

type Entry = {
  key: string;
  label: string;
  section: string;
  href: string;
  icon: NavItem["icon"];
  keywords?: string;
};

export default function CommandPalette({
  restBase,
  branchBase,
}: {
  restBase: string;
  branchBase: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const entries = useMemo<Entry[]>(() => {
    const fromNav: Entry[] = NAV_SECTIONS.flatMap((section) =>
      section.items
        .filter((item) => !item.comingSoon)
        .map((item) => ({
          key: `${section.key}:${item.key}`,
          label: item.label,
          section: section.label,
          href: buildHref(item, restBase, branchBase),
          icon: item.icon,
        }))
    );
    const extras: Entry[] = [
      {
        key: "team",
        label: "Equipo",
        section: "Negocio",
        href: `${restBase}/profile/equipo`,
        icon: Users,
        keywords: "staff mozos invitar",
      },
      {
        key: "branches",
        label: "Sucursales",
        section: "Negocio",
        href: `${restBase}/profile/sucursales`,
        icon: MapPin,
        keywords: "sedes locales branches",
      },
      {
        key: "personalization",
        label: "Personalización del menú",
        section: "Negocio",
        href: `${restBase}/profile/personalizacion`,
        icon: Sparkles,
        keywords: "tema colores layout grid",
      },
    ];
    return [...fromNav, ...extras];
  }, [restBase, branchBase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      `${e.label} ${e.section} ${e.keywords ?? ""}`.toLowerCase().includes(q)
    );
  }, [entries, query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-lg">
          <Modal.Body className="p-0">
          <div className="border-b border-neutral-100 p-3">
            <TextField
              value={query}
              onChange={setQuery}
              autoFocus
              aria-label="Buscar"
            >
              <Input placeholder="Buscar sección, atajo..." />
            </TextField>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-400">
                Sin resultados
              </p>
            ) : (
              <ul>
                {filtered.map((e) => {
                  const Icon = e.icon;
                  return (
                    <li key={e.key}>
                      <button
                        type="button"
                        onClick={() => go(e.href)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-100"
                      >
                        <Icon size={15} className="text-neutral-500" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-neutral-800">
                            {e.label}
                          </p>
                          <p className="truncate text-xs text-neutral-400">
                            {e.section}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-[11px] text-neutral-500">
            <span>
              Atajo: <kbd className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-sans">⌘K</kbd> /{" "}
              <kbd className="rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-sans">Ctrl+K</kbd>
            </span>
            <span>Esc para cerrar</span>
          </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
