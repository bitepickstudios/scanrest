import { Skeleton } from "@heroui/react";

export default function ReviewsLoading() {
  return (
    <div className="p-8">
      <Skeleton className="h-6 w-20 rounded" />
      <div className="mt-6 flex items-center gap-8 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-16 rounded mx-auto" />
          <Skeleton className="h-3 w-20 rounded mx-auto" />
          <Skeleton className="h-3 w-16 rounded mx-auto" />
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-1.5 flex-1 rounded-full" />
              <Skeleton className="h-3 w-4 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
