import { Skeleton } from "@/components/ui/skeleton";

export default function TiposLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-xs" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div className="bg-muted/40 px-4 py-3">
          <Skeleton className="h-3.5 w-1/3" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-md" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
