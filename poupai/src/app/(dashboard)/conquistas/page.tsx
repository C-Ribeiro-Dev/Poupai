import type { Metadata } from "next";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/auth";
import { getConquistas } from "@/services/conquistas";

export const metadata: Metadata = { title: "Conquistas" };

export default async function ConquistasPage() {
  const userId = await getCurrentUserId();
  const data = await getConquistas(userId);

  const nivelCor =
    data.score >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : data.score >= 60
        ? "text-blue-600 dark:text-blue-400"
        : data.score >= 40
          ? "text-amber-600 dark:text-amber-400"
          : "text-red-600 dark:text-red-400";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Conquistas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {data.desbloqueadas} de {data.conquistas.length} conquistas desbloqueadas
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Trophy className="size-4 text-amber-500" />
            </div>
            <span className="text-sm text-muted-foreground">Conquistas</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {data.desbloqueadas}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              / {data.conquistas.length}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="size-4 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground">Sequência poupadora</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {data.streakMesesPositivos}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              {data.streakMesesPositivos === 1 ? "mês" : "meses"} no azul
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Trophy className="size-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">Nível financeiro</span>
          </div>
          <p className={cn("mt-3 text-2xl font-bold", nivelCor)}>
            {data.nivel}
            <span className="text-base font-normal text-muted-foreground"> · {data.score}/100</span>
          </p>
        </div>
      </div>

      {/* Grid de conquistas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.conquistas.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 transition-colors",
              c.desbloqueada
                ? "border-amber-300/60 bg-amber-500/5 dark:border-amber-800/50"
                : "border-border bg-card opacity-55 grayscale"
            )}
          >
            <span className="text-3xl" aria-hidden>
              {c.emoji}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{c.titulo}</p>
              <p className="text-xs text-muted-foreground">{c.descricao}</p>
              <p
                className={cn(
                  "mt-1 text-[11px] font-medium",
                  c.desbloqueada
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                )}
              >
                {c.desbloqueada ? "Desbloqueada ✓" : "Bloqueada"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
