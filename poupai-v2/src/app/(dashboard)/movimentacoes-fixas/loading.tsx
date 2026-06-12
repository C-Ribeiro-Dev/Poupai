import { Skeleton } from "@/components/ui/skeleton";

export default function MovimentacoesFixasLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-8 w-32 shrink-0 sm:w-52" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Skeleton className="h-9 flex-1" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="bg-muted/40 px-4 py-3">
          <Skeleton className="h-3.5 w-1/3" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
