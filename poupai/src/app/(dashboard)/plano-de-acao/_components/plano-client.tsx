"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Wallet,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  CalendarRange,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanoAcaoData, AcaoPlano, PrioridadePlano, TipoAcao, PeriodoPlano } from "@/types/plano-acao";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const TIPO_ICON: Record<TipoAcao, string> = {
  pagar: "💳",
  evitar_compra: "⚠️",
  guardar: "💰",
  revisar: "📋",
  antecipar: "⏫",
  reduzir_gastos: "📉",
  cancelar: "✂️",
};

const PRIO_CONFIG: Record<
  PrioridadePlano,
  { label: string; bg: string; cor: string; dot: string }
> = {
  urgente: {
    label: "Urgente",
    bg: "bg-destructive/10",
    cor: "text-destructive",
    dot: "bg-destructive",
  },
  alta: {
    label: "Alta",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    cor: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  media: {
    label: "Média",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    cor: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  baixa: {
    label: "Baixa",
    bg: "bg-muted/50",
    cor: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
};

const PERIODO_TABS: { id: PeriodoPlano; label: string; icon: React.ElementType }[] = [
  { id: "hoje", label: "Hoje", icon: Wallet },
  { id: "semana", label: "Esta Semana", icon: CalendarDays },
  { id: "mes", label: "Este Mês", icon: CalendarRange },
];

function AcaoCard({
  acao,
  concluida,
  onToggle,
}: {
  acao: AcaoPlano;
  concluida: boolean;
  onToggle: () => void;
}) {
  const prio = PRIO_CONFIG[acao.prioridade];
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        concluida ? "opacity-50 bg-muted/30" : "bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={concluida ? "Marcar como pendente" : "Marcar como concluída"}
        >
          {concluida ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : (
            <Circle className="size-5" />
          )}
        </button>

        <span className="text-xl leading-tight">{TIPO_ICON[acao.tipo]}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-semibold leading-snug",
                concluida && "line-through text-muted-foreground"
              )}
            >
              {acao.titulo}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                prio.bg,
                prio.cor
              )}
            >
              {prio.label}
            </span>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{acao.descricao}</p>

          {acao.valor !== undefined && (
            <p className={cn("mt-1 text-sm font-bold tabular-nums", prio.cor)}>
              {fmt(acao.valor)}
            </p>
          )}

          {acao.impacto && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground italic">
              <TrendingUp className="size-3 shrink-0 text-emerald-500" />
              {acao.impacto}
            </p>
          )}

          {acao.href && (
            <Link
              href={acao.href}
              className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver detalhes
              <ExternalLink className="size-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlanoClient({ data }: { data: PlanoAcaoData }) {
  const [tab, setTab] = useState<PeriodoPlano>("hoje");
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setConcluidas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const acoesMap: Record<PeriodoPlano, AcaoPlano[]> = {
    hoje: data.acoesHoje,
    semana: data.acoesSemana,
    mes: data.acoesMes,
  };

  const acoes = acoesMap[tab];
  const pendentes = acoes.filter((a) => !concluidas.has(a.id));
  const concluidasTab = acoes.filter((a) => concluidas.has(a.id));

  return (
    <div className="space-y-6">
      {/* Limite Diário Banner */}
      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border-2 p-4",
          data.limiteDiario.valor <= 0
            ? "border-destructive/40 bg-destructive/5"
            : data.limiteDiario.valor < 50
            ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
            : "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
        )}
      >
        <Wallet
          className={cn(
            "size-10 shrink-0",
            data.limiteDiario.valor <= 0
              ? "text-destructive"
              : data.limiteDiario.valor < 50
              ? "text-amber-500"
              : "text-emerald-500"
          )}
        />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Você pode gastar hoje</p>
          <p
            className={cn(
              "text-3xl font-black tabular-nums",
              data.limiteDiario.valor <= 0
                ? "text-destructive"
                : data.limiteDiario.valor < 50
                ? "text-amber-700"
                : "text-emerald-700"
            )}
          >
            {data.limiteDiario.valor <= 0 ? "R$ 0" : fmt(data.limiteDiario.valor)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{data.limiteDiario.explicacao}</p>
        </div>
        {data.resumo.urgentes > 0 && (
          <div className="shrink-0 flex flex-col items-center gap-1">
            <AlertTriangle className="size-6 text-destructive" />
            <span className="text-xs font-bold text-destructive">
              {data.resumo.urgentes} urgente{data.resumo.urgentes > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border bg-muted/30 p-1">
        {PERIODO_TABS.map(({ id, label, icon: Icon }) => {
          const count = acoesMap[id].filter((a) => !concluidas.has(a.id)).length;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                tab === id
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold",
                    tab === id
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de ações */}
      {acoes.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
          <p className="text-sm text-muted-foreground">Nenhuma ação para este período.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Pendentes */}
          {pendentes.map((acao) => (
            <AcaoCard
              key={acao.id}
              acao={acao}
              concluida={false}
              onToggle={() => toggle(acao.id)}
            />
          ))}

          {/* Concluídas */}
          {concluidasTab.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {concluidasTab.length} concluída{concluidasTab.length > 1 ? "s" : ""}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {concluidasTab.map((acao) => (
                <AcaoCard
                  key={acao.id}
                  acao={acao}
                  concluida
                  onToggle={() => toggle(acao.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Progresso */}
      {acoes.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Progresso de hoje</span>
            <span>
              {concluidas.size}/{data.acoesHoje.length + data.acoesSemana.length + data.acoesMes.length} total
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{
                width: `${
                  data.acoesHoje.length + data.acoesSemana.length + data.acoesMes.length > 0
                    ? (concluidas.size /
                        (data.acoesHoje.length + data.acoesSemana.length + data.acoesMes.length)) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
