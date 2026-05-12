import { Skeleton } from "@heroui/react";

export default function MenuLoading() {
  return (
    <div className="flex h-full gap-0">
      <div className="w-52 shrink-0 border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-3 py-3">
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <div className="space-y-1.5 p-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-28 rounded" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
                <div className="flex gap-1.5 mt-2">
                  <Skeleton className="h-6 w-14 rounded" />
                  <Skeleton className="h-6 w-24 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
