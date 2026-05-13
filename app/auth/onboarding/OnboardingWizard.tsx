"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Button, Card, Input } from "@heroui/react";
import { createRestaurant } from "@/lib/actions/restaurant";

type Mode = "table" | "foodcourt";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STEPS = ["Nombre", "Modo", "Redes"];

const labelClass = "mb-1 block text-sm font-medium text-neutral-700";

export default function OnboardingWizard({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [mode, setMode] = useState<Mode>("table");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const autoSlug = useMemo(() => slugify(name), [name]);
  const effectiveSlug = slugTouched ? slug : autoSlug;

  function next() {
    setError(null);
    if (step === 0) {
      if (!name.trim()) return setError("Poné el nombre del local.");
      if (!effectiveSlug) return setError("El nombre necesita letras o números.");
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const { slug: createdSlug } = await createRestaurant({
          name: name.trim(),
          slug: effectiveSlug,
          mode,
          whatsapp,
          instagram,
          facebook,
          tiktok,
        });
        router.push(`/admin/${createdSlug}`);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al crear el local.");
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/scanrest.svg"
            alt="ScanRest"
            width={2051}
            height={437}
            priority
            className="h-8 w-auto"
          />
          <p className="mt-3 text-sm text-neutral-500">
            Configurá tu local en menos de un minuto.
          </p>
          <p className="text-xs text-neutral-400">{email}</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  i < step
                    ? "bg-neutral-900 text-white"
                    : i === step
                    ? "bg-neutral-900 text-white ring-4 ring-neutral-900/10"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-10 transition-colors ${
                    i < step ? "bg-neutral-900" : "bg-neutral-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card variant="default" className="shadow-sm">
          <Card.Content className="!p-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    ¿Cómo se llama tu local?
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Lo que tus clientes verán arriba del menú.
                  </p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="name">
                    Nombre del restaurante
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: El Asador de Lucho"
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="slug">
                    URL del menú
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="select-none text-sm text-neutral-400">
                      scanrest.app/
                    </span>
                    <Input
                      id="slug"
                      value={effectiveSlug}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                        setSlugTouched(true);
                      }}
                      placeholder="el-asador-de-lucho"
                      className="flex-1"
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    Sólo letras, números y guiones.
                  </p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    ¿Cómo entregás los pedidos?
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Cambia cómo aparecen los pedidos en cocina.
                  </p>
                </div>
                <div className="grid gap-3">
                  <ModeOption
                    selected={mode === "table"}
                    onSelect={() => setMode("table")}
                    icon={<UtensilsCrossed size={20} />}
                    title="Mesas"
                    description="Cada QR es de una mesa. Llevás el pedido al cliente."
                  />
                  <ModeOption
                    selected={mode === "foodcourt"}
                    onSelect={() => setMode("foodcourt")}
                    icon={<Store size={20} />}
                    title="Food court / Mostrador"
                    description="El cliente retira en barra cuando aparece su número."
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Redes y contacto
                  </h2>
                  <p className="text-sm text-neutral-500">
                    Opcional. Lo podés completar después desde el panel.
                  </p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="whatsapp">
                    WhatsApp
                  </label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+595 9XX XXX XXX"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="instagram">
                    Instagram
                  </label>
                  <Input
                    id="instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@tu_usuario"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="facebook">
                    Facebook
                  </label>
                  <Input
                    id="facebook"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="facebook.com/tu-pagina"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="tiktok">
                    TikTok
                  </label>
                  <Input
                    id="tiktok"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@tu_usuario"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                onPress={back}
                isDisabled={step === 0 || isPending}
              >
                <ArrowLeft size={14} />
                Atrás
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" onPress={next}>
                  Siguiente
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onPress={submit}
                  isDisabled={isPending}
                >
                  {isPending ? "Creando..." : "Crear local"}
                  <Check size={14} />
                </Button>
              )}
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}

function ModeOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        selected
          ? "border-neutral-900 bg-neutral-50 ring-2 ring-neutral-900/10"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          selected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
      </div>
      {selected && <Check size={18} className="shrink-0 text-neutral-900" />}
    </button>
  );
}
