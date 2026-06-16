"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  AlertCircle,
  Info,
  CreditCard,
  CalendarCheck,
  Receipt,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SaldoProjetadoData,
  EventoProjetado,
  EventoTipo,
  PeriodoProjetado,
} from "@/types/saldo-projetado";
import { PERIODO_LABELS, periodoToFim, periodoToInicio } from "@/types/saldo-projetado";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDia = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const fmtPct = (v: number) =>
  `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const TIPO_ICON: Record<EventoTipo, React.ElementType> = {
  fixa_receita: TrendingUp,
  fixa_despesa: CalendarCheck,
  fatura_cartao: CreditCard,
  divida: Receipt,
  movimentacao_entrada: TrendingUp,
  movimentacao_saida: ArrowUpDown,
};

const TIPO_COR: Record<EventoTipo, string> = {
  fixa_receita: "text-emerald-600",
  fixa_despesa: "text-sky-600",
  fatura_cartao: "text-purple-600",
  divida: "text-orange-600",
  movimentacao_entrada: "text-emerald-600",
  movimentacao_saida: "text-rose-600",
};

const TIPO_BG: Record<EventoTipo, string> = {
  fixa_receita: "bg-emerald-50",
  fixa_despesa: "bg-sky-50",
  fatura_cartao: "bg-purple-50",
  divida: "bg-orange-50",
  movimentacao_entrada: "bg-emerald-50",
  movimentacao_saida: "bg-rose-50",
};

function EventoRow({ evento }: { evento: EventoProjetado }) {
  const [aberto, setAberto] = useState(false);
  const Icon = TIPO_ICON[evento.tipo];
  const cor = TIPO_COR[evento.tipo];
  const bg = TIPO_BG[evento.tipo];
  const impacto =
    evento.saldoAntes !== 0
      ? (evento.variacao / Math.abs(evento.saldoAntes)) * 100
      : 0;

  return (
    <div className="rounded-lg border bg-card shadow-xs">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", bg)}>
          <Icon className={cn("h-4 w-4", cor)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{evento.descricao}</p>
          {evento.categoria && (
            <p className="text-xs text-muted-foreground">{evento.categoria}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p
            className={cn(
              "text-sm font-semibold",
              evento.isEntrada ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {evento.isEntrada ? "+" : "-"}
            {fmt(evento.valor)}
          </p>
          <p className="text-xs text-muted-foreground">
            Saldo: {fmt(evento.saldoDepois)}
          </p>
        </div>

        {aberto ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {aberto && (
        <div className="border-t bg-muted/30 px-4 py-3 text-xs">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Saldo antes</p>
              <p className={cn("font-medium", evento.saldoAntes < 0 ? "text-destructive" : "")}>
                {fmt(evento.saldoAntes)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Variação</p>
              <p
                className={cn(
                  "font-medium",
                  evento.isEntrada ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {evento.isEntrada ? "+" : ""}
                {fmt(evento.variacao)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Saldo depois</p>
              <p
                className={cn(
                  "font-medium",
                  evento.saldoDepois < 0 ? "text-destructive" : ""
                )}
              >
                {fmt(evento.saldoDepois)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Impacto</p>
              <p className="font-medium">{fmtPct(impacto)}</p>
            </div>
          </div>
          <div className="mt-2">
            <Link href={evento.origem.href} className="text-primary hover:underline">
              {evento.origem.label} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

interface DiaGroup {
  data: Date;
  chave: string;
  eventos: EventoProjetado[];
  saldoAoFinal: number;
}

export function SaldoProjetadoClient({ data }: { data: SaldoProjetadoData }) {
  const [periodo, setPeriodo] = useState<PeriodoProjetado>("mes_atual");

  const now = useMemo(() => new Date(), []);

  const eventosFiltrados = useMemo(() => {
    const inicio = periodoToInicio(periodo, now);
    const fim = periodoToFim(periodo, now);
    return data.eventos.filter((e) => e.data >= inicio && e.data <= fim);
  }, [data.eventos, periodo, now]);

  const grupos = useMemo<DiaGroup[]>(() => {
    const map = new Map<string, DiaGroup>();
    for (const e of eventosFiltrados) {
      const chave = e.data.toISOString().slice(0, 10);
      if (!map.has(chave)) {
        map.set(chave, {
          data: new Date(e.data.getFullYear(), e.data.getMonth(), e.data.getDate()),
          chave,
          eventos: [],
          saldoAoFinal: e.saldoDepois,
        });
      }
      const g = map.get(chave)!;
      g.eventos.push(e);
      g.saldoAoFinal = e.saldoDepois;
    }
    return [...map.values()].sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [eventosFiltrados]);

  const saldoInicialPeriodo = useMemo(() => {
    if (!eventosFiltrados.length) return data.saldoAtual;
    return eventosFiltrados[0].saldoAntes;
  }, [eventosFiltrados, data.saldoAtual]);

  const saldoFinalPeriodo = useMemo(() => {
    if (!eventosFiltrados.length) return data.saldoAtual;
    return eventosFiltrados[eventosFiltrados.length - 1].saldoDepois;
  }, [eventosFiltrados, data.saldoAtual]);

  const variacaoPeriodo = saldoFinalPeriodo - saldoInicialPeriodo;
  const temNegativoNoPeriodo = eventosFiltrados.some((e) => e.saldoDepois < 0);

  const alertasNoPeriodo = useMemo(() => {
    const inicio = periodoToInicio(periodo, now);
    const fim = periodoToFim(periodo, now);
    return data.alertas.filter((a) => !a.data || (a.data >= inicio && a.data <= fim));
  }, [data.alertas, periodo, now]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Saldo Projetado</h1>
        <p className="text-sm text-muted-foreground">
          Veja como seu saldo evolui considerando todos os compromissos cadastrados.
        </p>
      </div>

      {/* Período */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PERIODO_LABELS) as PeriodoProjetado[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              periodo === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {PERIODO_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Saldo atual</p>
          <p className="text-lg font-bold">{fmt(data.saldoAtual)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Fim do período</p>
          <p
            className={cn(
              "text-lg font-bold",
              saldoFinalPeriodo < 0 ? "text-destructive" : ""
            )}
          >
            {fmt(saldoFinalPeriodo)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Maior saldo previsto</p>
          <p className="text-lg font-bold text-emerald-600">{fmt(data.maiorSaldo.valor)}</p>
          {data.maiorSaldo.data && (
            <p className="text-[10px] text-muted-foreground">{fmtDia(data.maiorSaldo.data)}</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Menor saldo previsto</p>
          <p
            className={cn(
              "text-lg font-bold",
              data.menorSaldo.valor < 0 ? "text-destructive" : "text-amber-600"
            )}
          >
            {fmt(data.menorSaldo.valor)}
          </p>
          {data.menorSaldo.data && (
            <p className="text-[10px] text-muted-foreground">{fmtDia(data.menorSaldo.data)}</p>
          )}
        </div>
      </div>

      {/* Alertas */}
      {alertasNoPeriodo.length > 0 && (
        <div className="space-y-2">
          {alertasNoPeriodo.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-lg px-4 py-3 text-sm",
                a.severidade === "critico"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-50 text-amber-800"
              )}
            >
              {a.severidade === "critico" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{a.descricao}</span>
            </div>
          ))}
        </div>
      )}

      {/* Linha do tempo */}
      <div className="space-y-4">
        {/* Saldo de partida */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">
              {periodo === "proximo_mes"
                ? "Início do próximo mês"
                : "Hoje"}
            </p>
          </div>
          <p className="text-sm font-bold">{fmt(saldoInicialPeriodo)}</p>
        </div>

        {grupos.length === 0 && (
          <div className="rounded-xl border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
            Nenhum evento previsto neste período.
          </div>
        )}

        {grupos.map((grupo) => {
          const isHoje =
            grupo.data.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
          const saldoNegativoNoDia = grupo.saldoAoFinal < 0;
          return (
            <div key={grupo.chave} className="space-y-2">
              {/* Cabeçalho do dia */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    saldoNegativoNoDia
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {grupo.data.getDate().toString().padStart(2, "0")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {grupo.data.toLocaleDateString("pt-BR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}
                    {isHoje && (
                      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                        hoje
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo ao final</p>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      saldoNegativoNoDia ? "text-destructive" : ""
                    )}
                  >
                    {fmt(grupo.saldoAoFinal)}
                  </p>
                </div>
              </div>

              {/* Eventos do dia */}
              <div className="ml-11 space-y-2">
                {grupo.eventos.map((e) => (
                  <EventoRow key={e.id} evento={e} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Saldo final do período */}
        {grupos.length > 0 && (
          <div className="flex items-center gap-3 border-t pt-4">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                saldoFinalPeriodo < 0 ? "bg-destructive/10" : "bg-emerald-50"
              )}
            >
              {saldoFinalPeriodo < 0 ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Saldo ao final do período
              </p>
              <p className="text-xs text-muted-foreground">
                Variação:{" "}
                <span
                  className={cn(
                    variacaoPeriodo >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {variacaoPeriodo >= 0 ? "+" : ""}
                  {fmt(variacaoPeriodo)}
                </span>
              </p>
            </div>
            <p
              className={cn(
                "text-xl font-bold",
                saldoFinalPeriodo < 0 ? "text-destructive" : ""
              )}
            >
              {fmt(saldoFinalPeriodo)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
