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
  QrCode,
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
      <Differentiators />
      <Testimonials />
      <FinalCta />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/scanrest.svg"
            alt="ScanRest"
            width={2051}
            height={437}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <Chip
          size="sm"
          variant="soft"
          color="accent"
          className="ml-2 hidden sm:inline-flex"
        >
        </Chip>
        <nav className="ml-auto hidden items-center gap-7 text-sm font-medium text-[var(--muted)] md:flex">
          <a href="#how" className="hover:text-[var(--foreground)]">
            Cómo funciona
          </a>
          <a href="#audience" className="hover:text-[var(--foreground)]">
            Para quién es
          </a>
          <a href="#why" className="hover:text-[var(--foreground)]">
            Por qué ScanRest
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link href="/auth/login" className="hidden sm:inline-block">
            <Button variant="ghost" size="sm">
              Ingresar
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="primary" size="sm">
              Empezar gratis
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:pt-20">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--accent)]/15 via-transparent to-transparent" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div>
          <Chip variant="soft" color="accent" size="sm" className="mb-5">
            <span className="text-xs font-medium">
              Hecho en Paraguay · Beta abierta
            </span>
          </Chip>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            La forma más simple de vender desde tu salón
          </h1>
          <p className="mt-5 max-w-lg text-lg text-[var(--muted)]">
            ScanRest convierte cada mesa en un punto de venta. Tus clientes
            escanean, piden y pagan sin esperar al mozo. Vos te enfocás en
            cocinar.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/auth/register">
              <Button variant="primary" size="lg">
                Crear mi restaurante
                <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#how">
              <Button variant="secondary" size="lg">
                Ver cómo funciona
              </Button>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted)]">
            <span className="inline-flex items-center gap-1">
              <Check size={14} className="text-[var(--accent)]" />
              Sin tarjeta para arrancar
            </span>
            <span className="inline-flex items-center gap-1">
              <Check size={14} className="text-[var(--accent)]" />
              Sin comisiones por pedido
            </span>
            <span className="inline-flex items-center gap-1">
              <Check size={14} className="text-[var(--accent)]" />
              Setup en 5 minutos
            </span>
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-[var(--accent)]/30 via-transparent to-transparent blur-2xl" />
      <div className="rounded-[2.5rem] border-[10px] border-[var(--foreground)] bg-[var(--surface)] p-3 shadow-2xl">
        <div className="overflow-hidden rounded-[1.75rem] bg-[var(--background)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[var(--accent)]" />
              <div>
                <p className="text-xs font-bold leading-tight">El Asador</p>
                <p className="text-[10px] text-[var(--muted)]">Mesa 4</p>
              </div>
            </div>
            <QrCode size={14} className="text-[var(--muted)]" />
          </div>
          <div className="space-y-3 p-4">
            <MockProduct name="Lomito completo" price="45.000" qty={2} />
            <MockProduct name="Empanada de carne" price="12.000" qty={3} />
            <MockProduct name="Mojito sin alcohol" price="22.000" qty={1} />
          </div>
          <div className="border-t border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">Total</span>
              <span className="font-bold tabular-nums">Gs. 148.000</span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--background)]">
              Enviar pedido
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -right-2 -top-2 rotate-6 rounded-2xl bg-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--accent-foreground)] shadow-lg sm:-right-6">
        <div className="flex items-center gap-1">
          <Bell size={12} />
          ¡Pedido recibido!
        </div>
      </div>
    </div>
  );
}

function MockProduct({
  name,
  price,
  qty,
}: {
  name: string;
  price: string;
  qty: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/15 text-[10px] font-bold text-[var(--foreground)]">
          {qty}×
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <span className="tabular-nums text-[var(--muted)]">Gs. {price}</span>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10">
        <p className="text-xl font-semibold text-[var(--muted)]">
          Eliminá la fricción de vender desde tu salón
        </p>
        <div className="grid w-full grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <Metric value="-40%" label="tiempo de espera" />
          <Metric value="+22%" label="ticket promedio" />
          <Metric value="<5min" label="setup inicial" />
          <Metric value="0%" label="comisión por pedido" />
        </div>
      </div>
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
      <div className="mx-auto max-w-3xl text-center">
        <Chip variant="soft" color="accent" size="sm">
          <span className="text-xs font-medium">¿Qué es ScanRest?</span>
        </Chip>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Cargás tu menú, imprimís los QR y empezás a recibir pedidos.
        </h2>
        <p className="mt-5 text-lg text-[var(--muted)]">
          Todo en un solo lugar: catálogo, modificadores, fotos, mesas, cocina y
          reportes. Sin instalar nada. Sin firmar contratos.
        </p>
      </div>
    </section>
  );
}

function Audience() {
  const profiles = [
    {
      icon: Utensils,
      title: "Restaurantes con salón",
      desc: "QR por mesa. El mozo lleva la comida cuando está lista.",
    },
    {
      icon: Building2,
      title: "Patios de comida",
      desc: "Un QR general. El cliente retira en mostrador con su número.",
    },
    {
      icon: Coffee,
      title: "Cafeterías y bares",
      desc: "Menú digital con fotos. Reduce filas en barra.",
    },
    {
      icon: Truck,
      title: "Food trucks",
      desc: "Menú accesible desde el teléfono. Mañana cambiás el menú en 1 minuto.",
    },
    {
      icon: Wine,
      title: "Cervecerías y pubs",
      desc: "El cliente se sirve sin llamar al mozo en hora pico.",
    },
    {
      icon: Heart,
      title: "Restaurantes familiares",
      desc: "Cero comisiones. Lo que vendés queda con vos.",
    },
  ];
  return (
    <section id="audience" className="bg-[var(--surface)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <Chip variant="soft" color="accent" size="sm">
            <span className="text-xs font-medium">¿Para quién es?</span>
          </Chip>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Hecho para cómo trabajás vos.
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            No importa el tamaño del local. Si vendés comida o bebida, ScanRest
            te sirve.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/50 hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/15 text-[var(--foreground)]">
                <p.icon size={20} />
              </div>
              <h3 className="text-base font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommercialBenefit() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div>
          <Chip variant="soft" color="success" size="sm">
            <span className="text-xs font-medium">El dinero queda con vos</span>
          </Chip>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Cero comisiones por pedido.
          </h2>
          <p className="mt-5 text-lg text-[var(--muted)]">
            Otras plataformas se quedan con el 15-25% de lo que vendés.
            ScanRest no. Pagás una mensualidad fija y lo que facturás es tuyo.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <BenefitLine text="Sin retención de pagos: cobrás directo en tu caja." />
            <BenefitLine text="Sin sorpresas a fin de mes: tarifa fija." />
            <BenefitLine text="Tus datos son tuyos. Exportás cuando quieras." />
          </ul>
          <div className="mt-7">
            <Link href="/auth/register">
              <Button variant="primary" size="lg">
                Quiero empezar
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-sm font-semibold text-[var(--muted)]">
            Si vendés Gs. 30.000.000/mes
          </p>
          <div className="mt-4 space-y-3">
            <ComparisonRow
              label="Plataforma con 18% de comisión"
              value="Gs. 5.400.000"
              negative
            />
            <ComparisonRow
              label="ScanRest Pro (tarifa fija)"
              value="Gs. 150.000"
              highlight
            />
          </div>
          <div className="mt-6 rounded-2xl bg-[var(--accent)]/15 p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-[var(--muted)]">
              Te quedás con
            </p>
            <p className="mt-1 text-3xl font-black text-[var(--foreground)]">
              Gs. 5.250.000
            </p>
            <p className="text-xs text-[var(--muted)]">extra cada mes</p>
          </div>
        </div>
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
    {
      icon: ChefHat,
      title: "Cargás tu menú",
      desc: "Productos, fotos, modificadores, categorías. Importás desde Excel si tenés la lista.",
    },
    {
      icon: Printer,
      title: "Imprimís los QR",
      desc: "Uno por mesa o uno general en mostrador. Los generamos listos para imprimir.",
    },
    {
      icon: Smartphone,
      title: "El cliente escanea y pide",
      desc: "Ve tu menú con fotos. Arma el pedido. Lo manda con un toque.",
    },
    {
      icon: Bell,
      title: "Recibís el pedido al instante",
      desc: "Aparece en un Kanban en cocina. Arrastrás para cambiar estado.",
    },
    {
      icon: Package,
      title: "Marcás listo o entregado",
      desc: "El cliente ve el cambio en vivo. Sin tener que ir a preguntar.",
    },
    {
      icon: Zap,
      title: "Analizás tus ventas",
      desc: "Dashboard con productos top, ventas del día y ticket promedio.",
    },
  ];
  return (
    <section id="how" className="bg-[var(--surface)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <Chip variant="soft" color="accent" size="sm">
            <span className="text-xs font-medium">Cómo funciona</span>
          </Chip>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Del primer pedido al cierre de caja.
          </h2>
          <p className="mt-3 text-[var(--muted)]">
            Un recorrido pensado para que arranques hoy y crezcas mañana.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--background)]">
                  <s.icon size={18} />
                </div>
                <span className="text-3xl font-black text-[var(--border)]">
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Differentiators() {
  const items = [
    {
      icon: ShieldCheck,
      title: "Sin comisiones",
      desc: "Pagás una mensualidad y listo. Sin retenciones, sin sorpresas.",
    },
    {
      icon: MessageCircle,
      title: "Soporte en español",
      desc: "WhatsApp directo con personas reales. Te respondemos en horario comercial.",
    },
    {
      icon: Lock,
      title: "Tus datos son tuyos",
      desc: "Exportás clientes, ventas y reportes cuando quieras. Sin candados.",
    },
    {
      icon: Users,
      title: "Hecho para Paraguay",
      desc: "Guaraníes, modificadores típicos, factura, WhatsApp. No es un copy-paste de otro mercado.",
    },
  ];
  return (
    <section id="why" className="px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <Chip variant="soft" color="accent" size="sm">
            <span className="text-xs font-medium">Por qué ScanRest</span>
          </Chip>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            No somos otra plataforma más.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((d) => (
            <div
              key={d.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)]">
                <d.icon size={18} />
              </div>
              <h3 className="text-base font-bold">{d.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      quote:
        "En la primera semana ya cargaba el menú yo solo desde el celular. No tuve que llamar a nadie.",
      name: "Lucho M.",
      role: "Dueño · El Asador",
      tag: "Restaurante familiar",
    },
    {
      quote:
        "En hora pico no perdimos pedidos. Cocina los ve apilados, los va sacando uno por uno.",
      name: "María R.",
      role: "Gerente · Patio Yvera",
      tag: "Food court",
    },
    {
      quote:
        "Lo que más me gustó: dejé de pagar 18% de comisión. Eso pasó a ser mi sueldo.",
      name: "Carlos B.",
      role: "Owner · Brewdog Asu",
      tag: "Cervecería",
    },
  ];
  return (
    <section className="bg-[var(--surface)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <Chip variant="soft" color="accent" size="sm">
            <span className="text-xs font-medium">Lo que dicen</span>
          </Chip>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Restaurantes reales. Resultados reales.
          </h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {quotes.map((q) => (
            <div
              key={q.name}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6"
            >
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="fill-[var(--accent)] text-[var(--accent)]"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-[var(--foreground)]">
                “{q.quote}”
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-[var(--border)] pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/20 text-sm font-bold">
                  {q.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{q.name}</p>
                  <p className="text-xs text-[var(--muted)]">{q.role}</p>
                </div>
                <Chip size="sm" variant="soft" color="accent">
                  <span className="text-[10px]">{q.tag}</span>
                </Chip>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-[var(--foreground)] to-[var(--surface-tertiary)] p-10 text-center text-white shadow-xl sm:p-14">
        <Chip variant="soft" color="accent" size="sm">
          <span className="text-xs font-medium">Vos cocinás. Nosotros llevamos los pedidos a tu pantalla.</span>
        </Chip>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Empezá hoy. Sin tarjeta. Sin compromiso.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-white/70">
          Tu primer pedido por QR puede estar entrando esta misma tarde.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/register">
            <Button variant="primary" size="lg" className="!bg-[var(--accent)] !text-[var(--accent-foreground)]">
              Crear mi restaurante gratis
              <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="lg" className="!text-white">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/scanrest.svg"
            alt="ScanRest"
            width={2051}
            height={437}
            className="h-6 w-auto"
          />
          <span className="text-xs">© {new Date().getFullYear()} ScanRest · Hecho en Paraguay</span>
        </div>
        <div className="flex gap-5 text-xs">
          <Link href="/auth/login" className="hover:text-[var(--foreground)]">
            Ingresar
          </Link>
          <Link href="/auth/register" className="hover:text-[var(--foreground)]">
            Registrarse
          </Link>
          <a href="#how" className="hover:text-[var(--foreground)]">
            Cómo funciona
          </a>
        </div>
      </div>
    </footer>
  );
}
