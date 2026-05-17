"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@heroui/react";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function HeroWizard() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const slug = slugify(raw);

  function go() {
    if (!slug) return setError("Ingresá el nombre de tu restaurante.");
    router.push(`/auth/login?slug=${encodeURIComponent(slug)}`);
  }

  return (
    <div className="w-full space-y-2">
      {/* Mobile: input arriba, botón abajo */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
          <span className="flex select-none items-center whitespace-nowrap bg-[var(--surface)] px-4 py-4 text-base text-[var(--muted)]">
            scanrest.app/
          </span>
          <input
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="mi-restaurante"
            className="min-w-0 flex-1 bg-white px-4 py-4 text-base outline-none"
          />
        </div>
        <Button variant="primary" size="lg" className="w-full py-7 px-6 rounded-full" onPress={go}>
          Crear mi restaurante
          <ArrowRight size={17} />
        </Button>
      </div>

      {/* Desktop: input + botón separados */}
      <div className="hidden items-center gap-3 sm:flex">
        <div className="flex overflow-hidden rounded-full border border-[var(--border)] bg-[var(--background)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20">
          <span className="flex select-none items-center whitespace-nowrap bg-[var(--surface)] px-4 py-4 text-base text-[var(--muted)]">
            scanrest.app/
          </span>
          <input
            value={raw}
            onChange={(e) => { setRaw(e.target.value); setError(null); }}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder="mi-restaurante"
            className="min-w-0 w-52 bg-white px-4 py-4 text-base outline-none"
          />
        </div>
        <Button variant="primary" size="lg" className="shrink-0 py-7 px-6 rounded-full" onPress={go}>
          Crear mi restaurante
          <ArrowRight size={17} />
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
