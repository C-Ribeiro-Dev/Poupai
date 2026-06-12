import { Skeleton } from "@/components/ui/skeleton";

export default function MetasLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-28 shrink-0 sm:w-36" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
            <Skeleton className="mt-4 h-2.5 w-full rounded-full" />
            <div className="mt-2 flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="mt-4 h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
