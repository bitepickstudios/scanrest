"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bell } from "lucide-react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/auth/post-login");
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/post-login` },
    });
  }

  async function handleApple() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${location.origin}/auth/post-login` },
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
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Ingresá a tu panel de administración.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <TextField
              isRequired
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              className="w-full"
            >
              <Label>Email</Label>
              <Input placeholder="tu@email.com" />
            </TextField>

            <TextField
              isRequired
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              className="w-full"
            >
              <Label>Contraseña</Label>
              <Input placeholder="••••••••" />
            </TextField>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              className="rounded-full"
              isDisabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
              {!loading && <ArrowRight size={15} />}
            </Button>
          </form>

          {/* Legal */}
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            Al ingresar aceptás los{" "}
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
            <Button
              variant="outline"
              fullWidth
              className="rounded-full"
              onPress={handleGoogle}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </Button>
          </div>

          {/* Register link */}
          <p className="mt-8 text-center text-sm text-[var(--muted)]">
            ¿No tenés cuenta?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-[var(--foreground)] underline-offset-2 hover:underline"
            >
              Crear restaurante
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
