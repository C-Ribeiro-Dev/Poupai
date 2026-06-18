import { Skeleton } from "@/components/ui/skeleton";

export default function SaldoProjetadoLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
