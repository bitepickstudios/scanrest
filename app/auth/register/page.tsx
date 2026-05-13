"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

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
      setInfo(
        "Revisá tu email y confirmá tu cuenta. Luego volvé a ingresar para configurar tu local."
      );
      return;
    }

    router.push("/auth/onboarding");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/scanrest.svg"
            alt="ScanRest"
            width={2051}
            height={437}
            priority
            className="h-8 w-auto"
          />
          <p className="mt-3 text-sm text-neutral-500">
            Creá tu cuenta y empezá a recibir pedidos
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium"
                htmlFor="password"
              >
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
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </div>

          <p className="mt-4 text-center text-sm text-neutral-500">
            ¿Ya tenés cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-neutral-900 underline-offset-2 hover:underline"
            >
              Ingresá
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
