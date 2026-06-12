import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSkeleton } from "./_components/dashboard-skeleton";

// O loading da raiz não tem acesso ao AppShell (que depende do usuário),
// então simula a estrutura do shell para a transição ficar contínua.
export default function RootLoading() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar placeholder */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-6">
          <span className="text-base font-bold text-sidebar-foreground">Poupai</span>
        </div>
        <div className="flex flex-col gap-1 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header placeholder */}
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
          <Skeleton className="size-8 rounded-lg md:hidden" />
          <div className="flex-1" />
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="size-8 rounded-full" />
        </div>
        <main className="flex-1 overflow-y-auto">
          <DashboardSkeleton />
        </main>
      </div>
    </div>
  );
}
