import Link from "next/link";
import { Button } from "@heroui/react";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 text-center">
      <p className="text-7xl font-black text-neutral-900">404</p>
      <h1 className="mt-3 text-xl font-bold text-neutral-900">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutral-500">
        La página que buscás no existe o fue movida.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="primary" className="rounded-xl">
          <Home size={16} />
          Volver al inicio
        </Button>
      </Link>
    </main>
  );
}
