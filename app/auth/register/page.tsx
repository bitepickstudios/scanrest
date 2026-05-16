"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bell, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("slug") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (!data.user) {
      setError("No se pudo crear el usuario.");
      setLoading(false);
      return;
    }
    if (!data.session) {
      setLoading(false);
      setInfo("Revisá tu email y confirmá tu cuenta. Luego volvé a ingresar para configurar tu local.");
      return;
    }

    router.push("/auth/onboarding");
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/onboarding` },
    });
  }

  async function handleApple() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${location.origin}/auth/onboarding` },
    });
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-10 md:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/scanrest.svg"
              alt="ScanRest"
              width={2051}
              height={437}
              priority
              className="h-7 w-auto"
            />
          </Link>

          {/* Title */}
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Creá tu restaurante
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {slug
              ? <>Tu menú en <span className="font-medium text-[var(--foreground)]">scanrest.app/{slug}</span></>
              : "Empezá gratis. Sin tarjeta. Sin comisiones."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-3 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Legal */}
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            Al registrarte aceptás los{" "}
            <a href="#" className="underline underline-offset-2">
              Términos de uso
            </a>{" "}
            y la{" "}
            <a href="#" className="underline underline-offset-2">
              Política de privacidad
            </a>
            .
          </p>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs font-medium text-[var(--muted)]">O</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Social */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <button
              type="button"
              onClick={handleApple}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--surface)]"
            >
              <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.4-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 30.9 0 111.3 2.6 168.3 75.4zm-225.1-191.6c33.7-39.5 57.9-94.2 57.9-148.9 0-7.7-.6-15.4-1.9-21.7-55.1 2-120.8 36.8-160.3 82.4-30.2 34.5-61.9 91.7-61.9 147.7 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 49.9 0 112.7-33.1 150.7-79.9z"/>
              </svg>
              Continuar con Apple
            </button>
          </div>

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Ingresá
            </Link>
          </p>
        </div>
      </div>

      {/* Right — visual */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-[var(--accent)]/20 via-[var(--surface)] to-[var(--surface)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent)]/20">
            <Bell size={36} className="text-[var(--accent)]" />
          </div>
          <p className="text-base font-semibold text-[var(--muted)]">Imagen próximamente</p>
          <p className="text-sm text-[var(--border)]">screenshot del panel admin</p>
        </div>
      </div>
    </div>
  );
}
