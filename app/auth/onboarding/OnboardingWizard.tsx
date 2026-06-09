"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Store,
  UtensilsCrossed,
  Globe,
  Camera,
  MessageCircle,
  Music2,
} from "lucide-react";
import {
  Button,
  Input,
  TextField,
  TextArea,
  Label,
  Description,
  FieldError,
  ProgressBar,
} from "@heroui/react";
import { createRestaurantWithDefaultBranch } from "@/lib/actions/restaurant";
import {
  step1Schema,
  step2Schema,
} from "@/lib/validations/onboarding";
import OnboardingPreview from "./OnboardingPreview";

type Mode = "table" | "foodcourt";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const STEPS = [
  { id: 0, title: "Tu restaurante", subtitle: "Nombre, URL y descripción" },
  { id: 1, title: "Cómo operás", subtitle: "Modo de servicio y ubicación" },
  { id: 2, title: "Redes y contacto", subtitle: "Opcional — podés saltarlas" },
] as const;

export default function OnboardingWizard({ email }: { email: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");

  // Step 2
  const [mode, setMode] = useState<Mode | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const autoSlug = useMemo(() => slugify(name), [name]);
  const effectiveSlug = slugTouched ? slug : autoSlug;

  // Re-trigger entry animation on step change
  const [animateKey, setAnimateKey] = useState(0);
  useEffect(() => {
    setAnimateKey((k) => k + 1);
  }, [step]);

  function clearErr(field: string) {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }

  function next() {
    setGlobalError(null);

    if (step === 0) {
      const parsed = step1Schema.safeParse({
        name,
        slug: effectiveSlug,
        description,
      });
      if (!parsed.success) {
        const flat: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          flat[issue.path[0] as string] = issue.message;
        }
        setErrors(flat);
        return;
      }
      setErrors({});
      setStep(1);
      return;
    }

    if (step === 1) {
      const parsed = step2Schema.safeParse({ mode, address, phone });
      if (!parsed.success) {
        const flat: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          flat[issue.path[0] as string] = issue.message;
        }
        setErrors(flat);
        return;
      }
      setErrors({});
      setStep(2);
      return;
    }
  }

  function back() {
    setGlobalError(null);
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setGlobalError(null);
    if (!mode) return;
    startTransition(async () => {
      try {
        const { restaurantSlug, branchSlug } =
          await createRestaurantWithDefaultBranch({
            name: name.trim(),
            slug: effectiveSlug,
            description: description.trim() || null,
            mode,
            address: address.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || null,
            instagram: instagram.trim() || null,
            facebook: facebook.trim() || null,
            tiktok: tiktok.trim() || null,
          });
        router.push(`/admin/${restaurantSlug}/${branchSlug}`);
        router.refresh();
      } catch (e: unknown) {
        setGlobalError(
          e instanceof Error ? e.message : "Error al crear el restaurante."
        );
      }
    });
  }

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progressValue = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top progress strip */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-12">
          <Image
            src="/scanrest.svg"
            alt="ScanRest"
            width={2051}
            height={437}
            priority
            className="h-5 w-auto md:h-6"
          />
          <span className="text-xs font-medium tabular-nums text-neutral-500 md:text-sm">
            Paso {step + 1} de {STEPS.length}
          </span>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-3 md:px-12">
          <ProgressBar
            aria-label="Progreso onboarding"
            value={progressValue}
            color="accent"
            size="sm"
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-32 pt-8 md:grid-cols-[1fr_minmax(320px,400px)] md:gap-16 md:px-12 md:pb-12 md:pt-16">
        {/* Form column */}
        <div>
          <div
            key={animateKey}
            className="animate-fade-up"
          >
            <header className="mb-8">
              <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                {currentStep.title}
              </h1>
              <p className="mt-2 text-base text-neutral-500">
                {currentStep.subtitle}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Sesión: <span className="text-neutral-500">{email}</span>
              </p>
            </header>

            {step === 0 && (
              <div className="space-y-5">
                <TextField
                  fullWidth
                  isRequired
                  value={name}
                  onChange={(v) => {
                    setName(v);
                    clearErr("name");
                  }}
                  isInvalid={!!errors.name}
                >
                  <Label>Nombre del restaurante</Label>
                  <Input placeholder="Ej: El Asador de Lucho" autoFocus />
                  {errors.name ? (
                    <FieldError>{errors.name}</FieldError>
                  ) : (
                    <Description>
                      Aparece arriba del menú que ven tus clientes.
                    </Description>
                  )}
                </TextField>

                <TextField
                  fullWidth
                  isRequired
                  value={effectiveSlug}
                  onChange={(v) => {
                    setSlug(slugify(v));
                    setSlugTouched(true);
                    clearErr("slug");
                  }}
                  isInvalid={!!errors.slug}
                >
                  <Label>URL del menú</Label>
                  <Input placeholder="el-asador-de-lucho" />
                  {errors.slug ? (
                    <FieldError>{errors.slug}</FieldError>
                  ) : (
                    <Description>
                      scanrest.app/<span className="font-medium text-neutral-700">{effectiveSlug || "tu-url"}</span>
                    </Description>
                  )}
                </TextField>

                <TextField
                  fullWidth
                  value={description}
                  onChange={(v) => {
                    setDescription(v.slice(0, 240));
                    clearErr("description");
                  }}
                  isInvalid={!!errors.description}
                >
                  <Label>Descripción</Label>
                  <TextArea
                    placeholder="Hamburguesas artesanales, carnes a la parrilla, cervezas tiradas..."
                    rows={3}
                  />
                  {errors.description ? (
                    <FieldError>{errors.description}</FieldError>
                  ) : (
                    <Description>
                      Opcional · {description.length}/240
                    </Description>
                  )}
                </TextField>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block text-sm font-medium text-neutral-700">
                    ¿Cómo entregás los pedidos? <span className="text-danger">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ModeCard
                      selected={mode === "table"}
                      onSelect={() => {
                        setMode("table");
                        clearErr("mode");
                      }}
                      icon={<UtensilsCrossed size={22} />}
                      title="Mesas"
                      description="Cada QR pertenece a una mesa. Servís en sala."
                    />
                    <ModeCard
                      selected={mode === "foodcourt"}
                      onSelect={() => {
                        setMode("foodcourt");
                        clearErr("mode");
                      }}
                      icon={<Store size={22} />}
                      title="Food court"
                      description="Cliente retira en mostrador con su número."
                    />
                  </div>
                  {errors.mode && (
                    <p className="mt-2 text-xs text-danger">{errors.mode}</p>
                  )}
                </div>

                <TextField
                  fullWidth
                  isRequired
                  value={address}
                  onChange={(v) => {
                    setAddress(v);
                    clearErr("address");
                  }}
                  isInvalid={!!errors.address}
                >
                  <Label>Dirección de la sucursal</Label>
                  <Input placeholder="Av. España 123, Asunción" />
                  {errors.address ? (
                    <FieldError>{errors.address}</FieldError>
                  ) : (
                    <Description>
                      Tu primera sucursal se crea con estos datos.
                    </Description>
                  )}
                </TextField>

                <TextField
                  fullWidth
                  isRequired
                  type="tel"
                  value={phone}
                  onChange={(v) => {
                    setPhone(v);
                    clearErr("phone");
                  }}
                  isInvalid={!!errors.phone}
                >
                  <Label>Teléfono de contacto</Label>
                  <Input placeholder="+595 9XX XXX XXX" />
                  {errors.phone && <FieldError>{errors.phone}</FieldError>}
                </TextField>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <SocialField
                  icon={<MessageCircle size={16} />}
                  label="WhatsApp"
                  placeholder="+595 9XX XXX XXX"
                  value={whatsapp}
                  onChange={setWhatsapp}
                  type="tel"
                />
                <SocialField
                  icon={<Camera size={16} />}
                  label="Instagram"
                  placeholder="@tu_usuario"
                  value={instagram}
                  onChange={setInstagram}
                />
                <SocialField
                  icon={<Globe size={16} />}
                  label="Facebook"
                  placeholder="facebook.com/tu-pagina"
                  value={facebook}
                  onChange={setFacebook}
                />
                <SocialField
                  icon={<Music2 size={16} />}
                  label="TikTok"
                  placeholder="@tu_usuario"
                  value={tiktok}
                  onChange={setTiktok}
                />

                <p className="rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
                  Estos campos son opcionales. Vas a poder agregarlos o editarlos después desde tu perfil.
                </p>
              </div>
            )}

            {globalError && (
              <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {globalError}
              </p>
            )}

            {/* Desktop footer nav */}
            <div className="mt-10 hidden items-center justify-between gap-3 md:flex">
              <Button
                variant="ghost"
                onPress={back}
                isDisabled={step === 0 || isPending}
              >
                <ArrowLeft size={14} />
                Atrás
              </Button>
              {!isLast ? (
                <Button variant="primary" onPress={next}>
                  Continuar
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button variant="primary" onPress={submit} isDisabled={isPending}>
                  {isPending ? "Creando..." : "Crear restaurante"}
                  <Check size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Preview column */}
        <aside className="hidden md:block">
          <OnboardingPreview
            name={name}
            description={description}
            mode={mode}
            address={address}
          />
        </aside>
      </div>

      {/* Mobile sticky footer */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-2 px-5 py-3">
          <Button
            variant="ghost"
            onPress={back}
            isDisabled={step === 0 || isPending}
            isIconOnly
            aria-label="Atrás"
          >
            <ArrowLeft size={16} />
          </Button>
          {!isLast ? (
            <Button variant="primary" onPress={next} className="flex-1">
              Continuar
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button
              variant="primary"
              onPress={submit}
              isDisabled={isPending}
              className="flex-1"
            >
              {isPending ? "Creando..." : "Crear restaurante"}
              <Check size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeCard({
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
      data-selected={selected}
      className={`group relative flex min-h-[124px] flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_8%,white)] ring-2 ring-[color-mix(in_oklch,var(--accent)_25%,transparent)]"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
          selected
            ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
            : "bg-neutral-100 text-neutral-600"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
      </div>
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function SocialField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <TextField fullWidth value={value} onChange={onChange} type={type}>
      <Label className="flex items-center gap-1.5">
        <span className="text-neutral-500">{icon}</span>
        {label}
      </Label>
      <Input placeholder={placeholder} />
    </TextField>
  );
}
