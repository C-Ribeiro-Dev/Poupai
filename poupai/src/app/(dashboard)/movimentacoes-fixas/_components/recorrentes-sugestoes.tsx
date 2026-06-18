"use client";
import { useState } from "react";
import { Sparkles, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { RecorrenteSugestao } from "@/services/recorrentes";

interface Props {
  sugestoes: RecorrenteSugestao[];
}

export function RecorrentesSugestoes({ sugestoes }: Props) {
  const [descartados, setDescartados] = useState<Set<string>>(new Set());

  const visiveis = sugestoes.filter((s) => !descartados.has(s.descricao));

  if (visiveis.length === 0) return null;

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/30 dark:bg-indigo-900/10">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 shrink-0 text-indigo-500" />
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
          Gastos recorrentes detectados
        </p>
        <span className="ml-auto rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
          {visiveis.length} sugestão{visiveis.length !== 1 ? "ões" : ""}
        </span>
      </div>
      <p className="mt-1 text-xs text-indigo-700/70 dark:text-indigo-400">
        Esses gastos aparecem com frequência no seu histórico. Considere cadastrá-los como
        movimentação fixa para melhor controle.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {visiveis.map((s) => (
          <div
            key={s.descricao}
            className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-white px-3 py-2.5 dark:border-indigo-800/30 dark:bg-indigo-950/30"
          >
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                s.isEntrada ? "bg-emerald-500/10" : "bg-red-500/10"
              )}
            >
              {s.isEntrada ? (
                <TrendingUp className="size-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="size-3.5 text-red-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{s.descricao}</p>
              <p className="text-xs text-muted-foreground">
                {s.ocorrencias} meses · média{" "}
                <span className="font-medium">{formatCurrency(s.valorMedio)}</span>
                {s.categoria && ` · ${s.categoria}`}
              </p>
            </div>
            <button
              onClick={() => setDescartados((prev) => new Set([...prev, s.descricao]))}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Descartar sugestão"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
