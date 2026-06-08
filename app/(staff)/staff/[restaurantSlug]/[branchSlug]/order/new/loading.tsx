import { Skeleton } from "@heroui/react";

export default function OrderNewLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3">
        <div className="flex items-start gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <Skeleton className="mt-3 h-10 w-full rounded-full" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </header>
      <div className="flex-1 space-y-2 p-3 pb-40 sm:p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3 w-2/5 rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
            </div>
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
