import { Skeleton } from "@heroui/react";

export default function AdminHomeLoading() {
  return (
    <div className="p-8">
      <Skeleton className="h-6 w-32 rounded" />
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
