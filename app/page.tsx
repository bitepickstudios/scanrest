import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  ChefHat,
  Check,
  Coffee,
  Heart,
  Lock,
  MessageCircle,
  Package,
  Printer,
  ShieldCheck,
  Smartphone,
  Star,
  Truck,
  Users,
  Utensils,
  Wine,
  Zap,
} from "lucide-react";
import { Button, Chip } from "@heroui/react";
import HeroWizard from "@/app/components/HeroWizard";
import Nav from "@/app/components/Nav";
import Reveal from "@/app/components/Reveal";
import RevealHeading from "@/app/components/RevealHeading";
import StaggerGrid from "@/app/components/StaggerGrid";
import InlinePop from "@/app/components/InlinePop";

export const metadata = {
  title: "ScanRest — La forma más simple de vender desde tu salón",
  description:
    "Tus clientes escanean, piden y reciben. Sin apps. Sin comisiones por pedido. Sin estrés.",
};

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Nav />
      <Hero />
      <SocialProof />
      <WhatItDoes />
      <Audience />
      <CommercialBenefit />
      <HowItWorks />
      <Testimonials />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-40 sm:pb-20 sm:pt-48 md:pt-40">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--accent)]/15 via-transparent to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-[3fr_2fr] md:gap-10">
        <div className="flex flex-col items-start">
          <RevealHeading
            as="h1"
            className="font-[family-name:var(--font-heading)] text-5xl leading-tighest tracking-tight sm:text-6xl lg:text-8xl lg:tracking-tighter"
            stagger={0.08}
            amount={0.1}
          >
            Tomá pedidos facilmente
          </RevealHeading>
          <Reveal delay={0.35} y={20}>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
              Tus clientes escanean y acceden a tu menú también gestionás tus
              pedidos y ventas.
            </p>
          </Reveal>
          <Reveal delay={0.55} y={20} className="mt-7 w-full sm:mt-8">
            <HeroWizard />
          </Reveal>
        </div>

        <HeroImagePlaceholder />
      </div>
    </section>
  );
}

function HeroImagePlaceholder() {
  return (
    <Reveal
      delay={0.25}
      y={50}
      duration={1.1}
      className="relative mx-auto hidden w-full max-w-sm items-center justify-center md:flex lg:max-w-md"
    >
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--accent)]/30 via-transparent to-transparent blur-2xl" />
      <Image
        src="/mobile.png"
        alt="ScanRest en móvil"
        width={400}
        height={600}
        className="h-auto w-full drop-shadow-2xl"
        priority
      />
    </Reveal>
  );
}

function SocialProof() {
  return (
    <section className="px-4">
      <Reveal className="mx-auto max-w-7xl rounded-3xl bg-[var(--surface)] px-6 py-10 sm:px-10">
        <p className="text-center text-lg font-semibold text-[var(--muted)] sm:text-xl">
          Eliminá la fricción en la atención
        </p>
        <StaggerGrid
          className="mt-6 grid grid-cols-2 gap-4 text-center sm:grid-cols-4"
          stagger={0.1}
        >
          <Metric value="-40%" label="tiempo de espera" />
          <Metric value="+22%" label="ticket promedio" />
          <Metric value="<5min" label="setup inicial" />
          <Metric value="0%" label="comisión por pedido" />
        </StaggerGrid>
      </Reveal>
    </section>
  );
}

function RatingBadge({
  service,
  rating,
  suffix,
}: {
  service: string;
  rating: string;
  suffix?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm">
      <Star size={14} className="fill-[var(--accent)] text-[var(--accent)]" />
      <span className="font-bold">{rating}</span>
      <span className="text-[var(--muted)]">
        {suffix ? suffix : `en ${service}`}
      </span>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{label}</p>
    </div>
  );
}

function WhatItDoes() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <RevealHeading
          className="font-[family-name:var(--font-heading)] mt-4 text-4xl tracking-tight sm:text-6xl md:text-8xl"
          stagger={0.05}
        >
          Cargás tu menú{" "}
          <InlinePop delay={0.15}>
            <Image
              src="/burger2.png"
              alt="Burger"
              width={96}
              height={96}
              className="inline-block w-12 h-auto align-middle sm:w-16 md:w-20"
            />
          </InlinePop>{" "}
          imprimís los QR y empezás a recibir pedidos{" "}
          <InlinePop delay={0.55}>
            <Image
              src="/orders.png"
              alt="Orders"
              width={96}
              height={96}
              className="inline-block w-11 h-auto align-middle sm:w-16 md:w-20"
            />
          </InlinePop>
          .
        </RevealHeading>
        <Reveal delay={0.3}>
          <p className="mt-5 text-lg text-[var(--muted)] max-w-3xl mx-auto">
            Todo en un solo lugar: catálogo, modificadores, fotos, mesas, cocina
            y reportes. Sin instalar nada. Sin firmar contratos.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Audience() {
  const profiles = [
    {
      icon: "/restaurante_salon.png",
      title: "Restaurantes con salón",
      desc: "QR por mesa. El mozo lleva la comida cuando está lista.",
    },
    {
      icon: "/patio_comidas.png",
      title: "Patios de comida",
      desc: "Un QR general. El cliente retira en mostrador con su número.",
    },
    {
      icon: "/foodtruck.png",
      title: "Food trucks",
      desc: "Menú accesible desde el teléfono. Cambiás el menú en 1 minuto.",
    },
    {
      icon: "/cervecerias.png",
      title: "Cervecerías y pubs",
      desc: "El cliente se sirve sin llamar al mozo en hora pico.",
    },
    {
      icon: "/cafeteria.png",
      title: "Cafeterías",
      desc: "Menú digital con fotos. Reduce filas en barra.",
    },
  ];
  return (
    <section id="audience" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <RevealHeading className="font-[family-name:var(--font-heading)] mt-4 text-2xl tracking-tight sm:text-4xl md:text-6xl">
            Hecho para todo tipo de locales.
          </RevealHeading>
          <Reveal delay={0.25}>
            <p className="mt-3 text-[var(--muted)]">
              Te transformamos en un restaurante digital
            </p>
          </Reveal>
        </div>
        <StaggerGrid
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          stagger={0.09}
        >
          {profiles.map((p) => (
            <div
              key={p.title}
              className="group h-full rounded-3xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center">
                <Image
                  src={p.icon}
                  alt={p.title}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                />
              </div>
              <h3 className="font-[family-name:var(--font-heading)] text-xl">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{p.desc}</p>
            </div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

function CommercialBenefit() {
  return (
    <section className="relative px-4 py-32 bg-slate-800 text-white">
      <svg
        className="absolute -top-px left-0 w-full h-6 sm:h-10"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,40 L160,10 L320,30 L480,5 L640,25 L800,8 L960,28 L1120,12 L1280,30 L1440,15 L1440,0 L0,0 Z"
          fill="var(--background)"
        />
      </svg>
      <svg
        className="absolute -bottom-px left-0 w-full h-6 sm:h-10"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,0 L90,28 L240,6 L360,22 L540,4 L720,30 L860,14 L1050,2 L1200,26 L1340,10 L1440,32 L1440,40 L0,40 Z"
          fill="var(--background)"
        />
      </svg>
      <div className="mx-auto max-w-5xl text-center">
        <RevealHeading
          className="font-[family-name:var(--font-heading)] text-5xl leading-[1.1] tracking-tight sm:text-6xl lg:text-8xl lg:tracking-tighter"
          stagger={0.08}
        >
          Cero comisiones por pedido.
        </RevealHeading>
        <Reveal delay={0.35}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white sm:text-xl">
            Otras plataformas se quedan con el 15-25% de lo que vendés. Acá pagás
            una tarifa fija y lo que facturás es tuyo.
          </p>
        </Reveal>
        <Reveal delay={0.5}>
          <div className="mt-10">
            <Link href="/auth/login">
              <Button variant="primary" size="lg" className="px-7 py-7 rounded-full">
                Quiero empezar
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function BenefitLine({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)]">
        <Check size={12} strokeWidth={3} />
      </div>
      <span>{text}</span>
    </li>
  );
}

function ComparisonRow({
  label,
  value,
  negative,
  highlight,
}: {
  label: string;
  value: string;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl p-3 ${
        highlight
          ? "border-2 border-[var(--accent)] bg-[var(--background)]"
          : "bg-[var(--background)]"
      }`}
    >
      <span className="text-sm">{label}</span>
      <span
        className={`text-base font-bold tabular-nums ${
          negative ? "text-red-600 line-through opacity-60" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { title: "Cargás tu menú", desc: "Productos, fotos, modificadores. Importás desde Excel." },
    { title: "Imprimís los QR", desc: "Uno por mesa o general. Listos para imprimir." },
    { title: "El cliente escanea y pide", desc: "Ve tu menú con fotos. Manda el pedido en un toque." },
    { title: "Recibís al instante", desc: "Aparece en el Kanban de cocina." },
    { title: "Marcás listo o entregado", desc: "El cliente ve el cambio en vivo." },
    { title: "Analizás tus ventas", desc: "Productos top, ventas del día, ticket promedio." },
  ];
  return (
    <section id="how" className=" px-4 py-24">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
        <div className="md:sticky md:top-32 md:self-start">
          <RevealHeading className="font-[family-name:var(--font-heading)] mt-4 text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Del primer pedido al cierre de caja.
          </RevealHeading>
          <Reveal delay={0.3}>
            <p className="mt-5 text-lg text-[var(--muted)]">
              Un recorrido pensado para que arranques hoy y crezcas mañana.
            </p>
          </Reveal>
        </div>
        <StaggerGrid className="block" stagger={0.1}>
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="grid grid-cols-[auto_1fr] gap-5 border-t border-[var(--border)] py-5 first:border-t-0 first:pt-0"
            >
              <span className="font-[family-name:var(--font-heading)] text-2xl text-[var(--muted)] sm:text-3xl">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-1 text-base text-[var(--muted)]">{s.desc}</p>
              </div>
            </div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

function Testimonials() {
  const restaurants = [
    { slug: "el-asador", name: "El Asador", type: "Parrilla" },
    { slug: "patio-yvera", name: "Patio Yvera", type: "Patio de comidas" },
  ];
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <RevealHeading className="font-[family-name:var(--font-heading)] text-4xl leading-[1.1] tracking-tight sm:text-5xl md:text-6xl">
            Restaurantes reales. Resultados reales.
          </RevealHeading>
        </div>
        <StaggerGrid className="mt-12 grid gap-6 md:grid-cols-2" stagger={0.15}>
          {restaurants.map((r) => (
            <Link
              key={r.slug}
              href={`/${r.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] transition-all hover:-translate-y-1 hover:border-[var(--accent)]/50 hover:shadow-xl"
            >
              <div className="relative flex aspect-[4/3] items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
                  <Smartphone size={48} strokeWidth={1.5} />
                  <span className="text-xs">Mockup próximamente</span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs text-[var(--muted)]">
                  scanrest.app/{r.slug}
                </p>
                <h3 className="font-[family-name:var(--font-heading)] mt-2 text-3xl">
                  {r.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{r.type}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] transition-all group-hover:gap-2">
                  Ver menú
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative px-4 py-32 bg-slate-800 text-white mt-12">
      <svg
        className="absolute -top-px left-0 w-full h-6 sm:h-10"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,40 L160,10 L320,30 L480,5 L640,25 L800,8 L960,28 L1120,12 L1280,30 L1440,15 L1440,0 L0,0 Z"
          fill="var(--background)"
        />
      </svg>
      <div className="mx-auto max-w-4xl text-center">
        <RevealHeading
          className="font-[family-name:var(--font-heading)] text-5xl leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl lg:tracking-tighter"
          stagger={0.07}
        >
          Empezá hoy. Sin tarjeta. Sin compromiso.
        </RevealHeading>
        <Reveal delay={0.35}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/80 sm:text-xl">
            Tu primer pedido por QR puede estar entrando esta misma tarde.
          </p>
        </Reveal>
        <Reveal delay={0.5}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="primary"
                size="lg"
                className="px-7 py-7 rounded-full"
              >
                Crear mi restaurante gratis
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-800 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/scanrest.svg"
              alt="ScanRest"
              width={2051}
              height={437}
              className="h-8 w-auto brightness-0 invert"
            />
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Pedidos por QR. Cocina conectada. Sin comisiones por pedido.
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg">
              Producto
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <a href="#how" className="hover:text-white">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#audience" className="hover:text-white">
                  Para quién es
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg">
              Cuenta
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <Link href="/auth/login" className="hover:text-white">
                  Ingresar
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-white">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-[family-name:var(--font-heading)] text-lg">
              Contacto
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              <li>
                <a
                  href="mailto:hola@scanrest.app"
                  className="hover:text-white"
                >
                  hola@scanrest.app
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/595000000000"
                  className="hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} ScanRest · Hecho en Paraguay</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white">
              Términos
            </a>
            <a href="#" className="hover:text-white">
              Privacidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
