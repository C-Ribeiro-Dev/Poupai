import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Greeting */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-2 rounded-xl border border-border bg-card p-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-1.5 h-3 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Insights chips */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-44 rounded-lg" />
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-9 w-52 rounded-lg" />
      </div>

      {/* Analytics */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-1.5 h-3 w-56" />
              <Skeleton className="mt-4 h-40 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
