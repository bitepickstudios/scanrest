import { Skeleton } from "@heroui/react";

export default function OrdersLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex w-72 shrink-0 flex-col gap-3">
            <Skeleton className="h-7 w-24 rounded-lg" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-4 w-10 rounded" />
                </div>
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
