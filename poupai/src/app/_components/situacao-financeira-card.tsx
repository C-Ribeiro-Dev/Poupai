"use client";

import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SituacaoFinanceiraData } from "@/types/situacao-financeira";

const DIAGNOSTICO_CONFIG = {
  estavel: {
    emoji: "🟢",
    label: "Estável",
    cor: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    resumo: "Sua situação financeira está sob controle.",
  },
  atencao: {
    emoji: "🟡",
    label: "Atenção",
    cor: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    icon: AlertTriangle,
    resumo: "Sua situação financeira exige alguns cuidados.",
  },
  critica: {
    emoji: "🔴",
    label: "Crítica",
    cor: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    icon: XCircle,
    resumo: "Atenção: sua situação financeira precisa de ação imediata.",
  },
};

export function SituacaoFinanceiraCard({ data }: { data: SituacaoFinanceiraData }) {
  const cfg = DIAGNOSTICO_CONFIG[data.diagnostico];
  const Icon = cfg.icon;
  const topProblema = data.problemas[0];
  const topPositivo = data.pontosPositivos[0];

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md", cfg.bg)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Situação Financeira</span>
        </div>
        <Link
          href="/situacao-financeira"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Ver análise completa
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Diagnóstico */}
      <div className="mb-4 flex items-center gap-3">
        <Icon className={cn("h-9 w-9 shrink-0", cfg.cor)} />
        <div>
          <p className={cn("text-lg font-bold", cfg.cor)}>
            {cfg.emoji} {cfg.label}
          </p>
          <p className="text-sm text-muted-foreground">{cfg.resumo}</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Score financeiro</span>
          <span className={cn("font-semibold", cfg.cor)}>{data.score}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              data.score >= 70 ? "bg-emerald-500" : data.score >= 40 ? "bg-amber-500" : "bg-destructive"
            )}
            style={{ width: `${data.score}%` }}
          />
        </div>
      </div>

      {/* Top problema ou positivo */}
      {topProblema ? (
        <div className="rounded-lg bg-black/5 px-3 py-2 text-xs">
          <p className="font-medium text-foreground">{topProblema.titulo}</p>
          <p className="text-muted-foreground">{topProblema.descricao}</p>
        </div>
      ) : topPositivo ? (
        <div className="rounded-lg bg-black/5 px-3 py-2 text-xs">
          <p className="font-medium text-emerald-700">{topPositivo.titulo}</p>
          <p className="text-muted-foreground">{topPositivo.descricao}</p>
        </div>
      ) : null}
    </div>
  );
}
