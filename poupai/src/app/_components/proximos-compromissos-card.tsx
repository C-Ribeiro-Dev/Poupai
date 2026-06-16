"use client";

import Link from "next/link";
import { CalendarRange, ArrowRight, CheckCircle2, AlertCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompromissoItem, CompromissoStatus, ProximosCompromissosData } from "@/types/compromissos";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDay = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d));

const statusConfig: Record<CompromissoStatus, { dot: string; badge: string; badgeText: string }> = {
  vencido: {
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
    badgeText: "Vencido",
  },
  hoje: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badgeText: "Hoje",
  },
  proximo: {
    dot: "bg-amber-400",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badgeText: "Em breve",
  },
  futuro: {
    dot: "bg-foreground/20",
    badge: "bg-foreground/8 text-muted-foreground",
    badgeText: "Futuro",
  },
  pago: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badgeText: "Pago",
  },
};

function groupByDate(items: CompromissoItem[]): Map<string, CompromissoItem[]> {
  const map = new Map<string, CompromissoItem[]>();
  for (const item of items) {
    const key = fmtDay(item.dataVencimento);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

function StatusIcon({ status }: { status: CompromissoStatus }) {
  if (status === "pago") return <CheckCircle2 className="size-3.5 text-emerald-500" />;
  if (status === "vencido") return <AlertCircle className="size-3.5 text-red-500" />;
  if (status === "hoje" || status === "proximo") return <AlertTriangle className="size-3.5 text-amber-500" />;
  return <Clock className="size-3.5 text-muted-foreground/50" />;
}

export function ProximosCompromissosCard({ data }: { data: ProximosCompromissosData }) {
  // Pegar os próximos 8 itens pendentes para o card
  const pendentes = data.compromissos
    .filter((c) => !c.pago && !c.isEntrada)
    .slice(0, 8);

  const grupos = groupByDate(pendentes);
  const temAlerta = data.totalVencido > 0;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border bg-card",
      temAlerta ? "border-red-300 dark:border-red-800/60" : "border-border"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            temAlerta ? "bg-red-500/10" : "bg-blue-500/10"
          )}>
            <CalendarRange className={cn("size-4", temAlerta ? "text-red-500" : "text-blue-500")} />
          </div>
          <h2 className="text-sm font-semibold">Próximos Compromissos</h2>
          {temAlerta && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
              {fmt(data.totalVencido)} vencido
            </span>
          )}
        </div>
        <Link
          href="/compromissos"
          className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Ver todos
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Lista agrupada por data */}
      {pendentes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <CheckCircle2 className="size-8 text-emerald-500/50" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum compromisso pendente</p>
          <p className="text-xs text-muted-foreground">Tudo em dia!</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {[...grupos.entries()].map(([data, itens]) => (
            <div key={data}>
              {/* Separador de data */}
              <div className="flex items-center gap-2 bg-muted/40 px-5 py-2">
                <span className="text-xs font-semibold text-muted-foreground">{data}</span>
                <span className="text-xs text-muted-foreground">
                  · {fmt(itens.reduce((acc, i) => acc + i.valor, 0))}
                </span>
              </div>
              {/* Itens da data */}
              {itens.map((item) => {
                const cfg = statusConfig[item.status];
                return (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={cn("mt-0.5 size-2 shrink-0 rounded-full", cfg.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.descricao}</p>
                      {item.categoria && (
                        <p className="truncate text-xs text-muted-foreground">{item.categoria}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {fmt(item.valor)}
                      </span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", cfg.badge)}>
                        <StatusIcon status={item.status} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Rodapé resumo */}
      {pendentes.length > 0 && (
        <div className="border-t border-border bg-muted/20 px-5 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total pendente</span>
            <span className="font-semibold text-foreground tabular-nums">
              {fmt(data.totalPendente)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
