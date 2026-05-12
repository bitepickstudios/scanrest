import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] p-8">
      <Image
        src="/scanrest.svg"
        alt="ScanRest"
        width={2051}
        height={437}
        priority
        className="h-auto w-64 max-w-full"
      />
      <p className="text-sm text-[var(--muted)]">Pide desde tu mesa, sin esperar.</p>
    </main>
  );
}
