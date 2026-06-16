import Link from "next/link";
import { TrendingDown, TrendingUp, Minus, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GastosInteligentesData } from "@/types/gastos-inteligentes";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function GastosInteligentesCard({ data }: { data: GastosInteligentesData }) {
  const { resumo, oportunidades, economiaPotencialTotal } = data;
  const topOportunidade = oportunidades[0] ?? null;
  const catCritica = resumo.categorias.find((c) => c.status === "critico")
    ?? resumo.categorias.find((c) => c.status === "atencao")
    ?? resumo.categorias[0];

  const variacaoPct = resumo.variacaoPct;
  const subindo = variacaoPct > 5;
  const caindo = variacaoPct < -5;

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-500" />
          <span className="text-sm font-semibold">Gastos Inteligentes</span>
        </div>
        {economiaPotencialTotal > 0 && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            Economia: {fmt(economiaPotencialTotal)}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-3 p-4">
        {/* Total mês atual */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Gastos este mês</p>
            <p className="text-2xl font-bold tabular-nums">{fmt(resumo.totalMesAtual)}</p>
          </div>
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            subindo ? "bg-red-50 text-red-600 dark:bg-red-950/30"
              : caindo ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
              : "bg-muted text-muted-foreground"
          )}>
            {subindo ? <TrendingUp className="size-3" /> : caindo ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
            {Math.abs(variacaoPct).toFixed(0)}%
            <span className="font-normal opacity-70">vs mês ant.</span>
          </div>
        </div>

        {/* Categoria mais crítica */}
        {catCritica && (
          <div className={cn(
            "rounded-lg border p-2.5",
            catCritica.status === "critico"
              ? "border-destructive/30 bg-destructive/5"
              : catCritica.status === "atencao"
              ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
              : "border-border bg-muted/30"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full" style={{ backgroundColor: catCritica.cor }} />
                <p className="text-xs font-medium">{catCritica.nome}</p>
              </div>
              <p className="text-xs font-bold tabular-nums">{fmt(catCritica.valorMesAtual)}</p>
            </div>
            {catCritica.percentualOrcamento !== null && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10">
                <div
                  className={cn(
                    "h-full rounded-full",
                    catCritica.percentualOrcamento > 120 ? "bg-destructive" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(catCritica.percentualOrcamento, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Maior oportunidade */}
        {topOportunidade && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/20">
            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-600">
              Oportunidade
            </p>
            <p className="mt-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {topOportunidade.titulo}
            </p>
            <p className="text-xs text-emerald-600">
              Economia: {fmt(topOportunidade.economiaPotencial)}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5">
        <Link
          href="/gastos-inteligentes"
          className="flex items-center justify-between text-xs font-medium text-primary hover:underline"
        >
          <span>Ver análise completa</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
