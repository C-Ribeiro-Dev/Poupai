import { Skeleton } from "@/components/ui/skeleton";

export default function InvestimentosLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-28 shrink-0 sm:w-36" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-36 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
