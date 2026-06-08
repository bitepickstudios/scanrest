import { Skeleton } from "@heroui/react";

export default function StaffHomeLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="mt-1 h-3 w-64 rounded" />
      </header>
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        {Array.from({ length: 2 }).map((_, s) => (
          <section key={s} className="mb-6">
            <Skeleton className="mb-2 h-3 w-24 rounded" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
