import { Skeleton } from "@heroui/react";

export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="relative">
        <Skeleton className="h-48 w-full rounded-none" />
        <Skeleton className="absolute -bottom-8 left-4 h-16 w-16 rounded-2xl" />
      </div>
      <div className="mt-12 px-4 space-y-2">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-4 w-56 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      <div className="mt-6 flex gap-3 overflow-x-auto px-4 pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="mt-4 px-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
            <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
            <div className="flex-1 py-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
