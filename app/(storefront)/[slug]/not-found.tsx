import Link from "next/link";
import { Button } from "@heroui/react";
import { Store } from "lucide-react";

export default function StorefrontNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Store size={36} className="text-neutral-400" />
      </div>
      <h1 className="mt-5 text-xl font-bold text-neutral-900">
        Restaurante no encontrado
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        El restaurante que buscás no existe o ya no está disponible.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="primary" className="rounded-xl">
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
