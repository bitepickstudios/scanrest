import { Skeleton } from "@heroui/react";

type Variant = "list" | "grid" | "form";

export default function PageSkeleton({
  variant = "list",
  rows = 6,
  cols = 3,
}: {
  variant?: Variant;
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <Skeleton className="h-5 w-40 rounded" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="flex-1 overflow-auto p-6">
        {variant === "list" && (
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3 rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
                <Skeleton className="h-8 w-20 shrink-0 rounded-lg" />
              </div>
            ))}
          </div>
        )}
        {variant === "grid" && (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5"
              >
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/5 rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
              </div>
            ))}
          </div>
        )}
        {variant === "form" && (
          <div className="max-w-xl space-y-5">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
