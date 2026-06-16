"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Circle, ArrowRight, Wallet, AlertCircle, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanoAcaoData, AcaoPlano, PrioridadePlano, TipoAcao } from "@/types/plano-acao";

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

const PRIO_COLORS: Record<PrioridadePlano, { dot: string; text: string }> = {
  urgente: { dot: "bg-destructive", text: "text-destructive" },
  alta: { dot: "bg-amber-500", text: "text-amber-600" },
  media: { dot: "bg-sky-500", text: "text-sky-600" },
  baixa: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

function AcaoRow({
  acao,
  concluida,
  onToggle,
}: {
  acao: AcaoPlano;
  concluida: boolean;
  onToggle: () => void;
}) {
  const prio = PRIO_COLORS[acao.prioridade];
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/50",
        concluida && "opacity-50"
      )}
    >
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label={concluida ? "Marcar como pendente" : "Marcar como concluída"}
      >
        {concluida ? (
          <CheckCircle2 className="size-4 text-emerald-500" />
        ) : (
          <Circle className="size-4" />
        )}
      </button>
      <span className="text-base leading-none">{TIPO_ICON[acao.tipo]}</span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-tight",
            concluida && "line-through text-muted-foreground"
          )}
        >
          {acao.titulo}
        </p>
        {acao.valor !== undefined && (
          <p className={cn("text-xs tabular-nums", prio.text)}>
            {fmt(acao.valor)}
          </p>
        )}
      </div>
      <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", prio.dot)} />
    </div>
  );
}

export function PlanoAcaoCard({ data }: { data: PlanoAcaoData }) {
  const [concluidas, setConcluidas] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setConcluidas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const top5 = data.acoesHoje.slice(0, 5);
  const limiteValor = data.limiteDiario.valor;
  const temUrgente = data.resumo.urgentes > 0;
  const concluidasHoje = top5.filter((a) => concluidas.has(a.id)).length;

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {temUrgente ? (
            <AlertCircle className="size-4 text-destructive" />
          ) : (
            <Banknote className="size-4 text-emerald-500" />
          )}
          <span className="text-sm font-semibold">Plano de Hoje</span>
          {data.resumo.urgentes > 0 && (
            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
              {data.resumo.urgentes} urgente{data.resumo.urgentes > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {concluidasHoje > 0 && (
          <span className="text-[11px] text-muted-foreground">
            {concluidasHoje}/{top5.length} concluídas
          </span>
        )}
      </div>

      {/* Limite Diário */}
      <div
        className={cn(
          "mx-4 mt-3 flex items-center gap-2 rounded-lg border px-3 py-2",
          limiteValor <= 0
            ? "border-destructive/40 bg-destructive/5"
            : limiteValor < 50
            ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
            : "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20"
        )}
      >
        <Wallet
          className={cn(
            "size-4 shrink-0",
            limiteValor <= 0
              ? "text-destructive"
              : limiteValor < 50
              ? "text-amber-600"
              : "text-emerald-600"
          )}
        />
        <div>
          <p className="text-[10px] text-muted-foreground">Limite diário</p>
          <p
            className={cn(
              "text-base font-bold tabular-nums",
              limiteValor <= 0
                ? "text-destructive"
                : limiteValor < 50
                ? "text-amber-700"
                : "text-emerald-700"
            )}
          >
            {limiteValor <= 0 ? "R$ 0" : fmt(limiteValor)}
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex-1 space-y-0.5 px-3 py-2">
        {top5.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma ação pendente para hoje 🎉
          </p>
        ) : (
          top5.map((acao) => (
            <AcaoRow
              key={acao.id}
              acao={acao}
              concluida={concluidas.has(acao.id)}
              onToggle={() => toggle(acao.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t px-4 py-2.5">
        <Link
          href="/plano-de-acao"
          className="flex items-center justify-between text-xs font-medium text-primary hover:underline"
        >
          <span>
            Ver plano completo
            {data.resumo.totalAcoes > 5 && (
              <span className="ml-1 text-muted-foreground">
                (+{data.resumo.totalAcoes - 5} ações)
              </span>
            )}
          </span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
