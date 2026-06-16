import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Target,
  Lightbulb,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/auth";
import { getSituacaoFinanceira } from "@/services/situacao-financeira";
import type {
  SituacaoFinanceiraData,
  DiagnosticoGeral,
  StatusIndicador,
  PrioridadeRecomendacao,
} from "@/types/situacao-financeira";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DIAGNOSTICO_CONFIG: Record<
  DiagnosticoGeral,
  { emoji: string; label: string; cor: string; bg: string; icon: React.ElementType; descricao: string }
> = {
  estavel: {
    emoji: "🟢",
    label: "Estável",
    cor: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2,
    descricao: "Sua situação financeira está saudável. Continue assim e busque evoluir.",
  },
  atencao: {
    emoji: "🟡",
    label: "Atenção",
    cor: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: AlertTriangle,
    descricao: "Há pontos a melhorar na sua saúde financeira. Acompanhe os itens abaixo.",
  },
  critica: {
    emoji: "🔴",
    label: "Crítica",
    cor: "text-destructive",
    bg: "bg-destructive/10 border-destructive/40",
    icon: XCircle,
    descricao: "Sua situação exige atenção imediata. Priorize as recomendações de alta prioridade.",
  },
};

const STATUS_CONFIG: Record<StatusIndicador, { cor: string; bg: string; label: string }> = {
  verde: { cor: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", label: "Bom" },
  amarelo: { cor: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", label: "Atenção" },
  vermelho: { cor: "text-destructive", bg: "bg-destructive/10 border-destructive/30", label: "Crítico" },
};

const PRIORIDADE_CONFIG: Record<
  PrioridadeRecomendacao,
  { label: string; bg: string; cor: string }
> = {
  alta: { label: "Alta", bg: "bg-destructive/10", cor: "text-destructive" },
  media: { label: "Média", bg: "bg-amber-500/10", cor: "text-amber-700 dark:text-amber-400" },
  baixa: { label: "Baixa", bg: "bg-sky-500/10", cor: "text-sky-700 dark:text-sky-400" },
};

function IndicadorCard({
  indicador,
}: {
  indicador: SituacaoFinanceiraData["indicadores"][keyof SituacaoFinanceiraData["indicadores"]];
}) {
  const st = STATUS_CONFIG[indicador.status];
  return (
    <div className={cn("rounded-xl border p-4", st.bg)}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{indicador.nome}</p>
        <span
          className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", st.bg, st.cor)}
        >
          {st.label}
        </span>
      </div>
      <p className={cn("text-xl font-bold", st.cor)}>{indicador.valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{indicador.descricao}</p>
      {indicador.detalhe && (
        <p className="mt-1 text-[10px] text-muted-foreground opacity-70">{indicador.detalhe}</p>
      )}
    </div>
  );
}

export default async function SituacaoFinanceiraPage() {
  const userId = await getCurrentUserId();
  const data = await getSituacaoFinanceira(userId);
  const cfg = DIAGNOSTICO_CONFIG[data.diagnostico];
  const DiagIcon = cfg.icon;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Situação Financeira</h1>
        <p className="text-sm text-muted-foreground">
          Diagnóstico automático baseado nos seus dados financeiros.
        </p>
      </div>

      {/* Diagnóstico geral */}
      <div className={cn("rounded-2xl border-2 p-6", cfg.bg)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <DiagIcon className={cn("h-12 w-12 shrink-0", cfg.cor)} />
          <div className="flex-1">
            <p className={cn("text-2xl font-bold", cfg.cor)}>
              {cfg.emoji} {cfg.label}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{cfg.descricao}</p>
          </div>
          <div className="shrink-0 text-center sm:text-right">
            <p className="text-xs text-muted-foreground">Score financeiro</p>
            <p className={cn("text-4xl font-black", cfg.cor)}>{data.score}</p>
            <p className="text-xs text-muted-foreground">de 100</p>
          </div>
        </div>

        {/* Barra do score */}
        <div className="mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-black/10">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                data.score >= 70
                  ? "bg-emerald-500"
                  : data.score >= 40
                    ? "bg-amber-500"
                    : "bg-destructive"
              )}
              style={{ width: `${data.score}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/70">
            <span>Crítica</span>
            <span>Atenção</span>
            <span>Estável</span>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Saldo atual", valor: fmt(data.metricas.saldoAtual) },
          { label: "Renda mensal", valor: fmt(data.metricas.receitaMensal) },
          { label: "Despesas fixas", valor: fmt(data.metricas.despesasMensais) },
          { label: "Fim do mês", valor: fmt(data.metricas.saldoFimMes), negativo: data.metricas.saldoFimMes < 0 },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border bg-card p-3">
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
            <p className={cn("text-base font-bold", m.negativo ? "text-destructive" : "")}>
              {m.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Indicadores */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Indicadores</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.values(data.indicadores).map((ind) => (
            <IndicadorCard key={ind.nome} indicador={ind} />
          ))}
        </div>
      </section>

      {/* Problemas */}
      {data.problemas.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <AlertCircle className="h-4 w-4 text-destructive" />
            Principais Problemas
          </h2>
          <div className="space-y-3">
            {data.problemas.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 rounded-xl border p-4",
                  p.severidade === "critico"
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-amber-500/20 bg-amber-500/10"
                )}
              >
                {p.severidade === "critico" ? (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-semibold">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground">{p.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pontos Positivos */}
      {data.pontosPositivos.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Pontos Positivos
          </h2>
          <div className="space-y-3">
            {data.pontosPositivos.map((p, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{p.titulo}</p>
                  <p className="text-sm text-muted-foreground">{p.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recomendações */}
      {data.recomendacoes.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Recomendações
          </h2>
          <div className="space-y-3">
            {data.recomendacoes.map((r, i) => {
              const pc = PRIORIDADE_CONFIG[r.prioridade];
              return (
                <div key={i} className="rounded-xl border bg-card p-4">
                  <div className="mb-2 flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        pc.bg,
                        pc.cor
                      )}
                    >
                      {pc.label}
                    </span>
                    <p className="text-sm font-semibold">{r.titulo}</p>
                  </div>
                  <p className="ml-12 text-sm text-muted-foreground">{r.descricao}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Links para ação */}
      <section className="rounded-xl border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">Ações rápidas</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { href: "/posso-fazer-isso", label: "Simular decisão" },
            { href: "/saldo-projetado", label: "Ver projeção" },
            { href: "/compromissos", label: "Compromissos" },
            { href: "/dividas", label: "Minhas dívidas" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-center gap-1 rounded-lg border bg-card px-3 py-2 text-xs font-medium hover:bg-muted/50"
            >
              {link.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
