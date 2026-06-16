"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarRange, CheckCircle2, AlertCircle, AlertTriangle, Clock,
  TrendingDown, TrendingUp, CreditCard, Receipt, ArrowUpDown, Filter,
  ChevronDown, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CompromissoItem,
  CompromissoStatus,
  CompromissoTipo,
  FiltroHorizonte,
  AgrupamentoCampo,
  ProximosCompromissosData,
} from "@/types/compromissos";
import { tipoLabel } from "@/types/compromissos";

// ─── Formatação ──────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));

const fmtDayMonth = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d));

// ─── Configs ─────────────────────────────────────────────────────────────────

const statusConfig: Record<CompromissoStatus, { label: string; dot: string; badge: string }> = {
  vencido: { label: "Vencido", dot: "bg-red-500", badge: "bg-red-500/10 text-red-600 dark:text-red-400" },
  hoje: { label: "Hoje", dot: "bg-amber-400", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  proximo: { label: "Em breve", dot: "bg-amber-400", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  futuro: { label: "Futuro", dot: "bg-foreground/20", badge: "bg-foreground/8 text-muted-foreground" },
  pago: { label: "Pago", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const tipoConfig: Record<CompromissoTipo, { icon: React.ElementType; color: string }> = {
  fixa_despesa: { icon: TrendingDown, color: "text-foreground" },
  fixa_receita: { icon: TrendingUp, color: "text-emerald-500" },
  fatura_cartao: { icon: CreditCard, color: "text-purple-500" },
  divida: { icon: Receipt, color: "text-orange-500" },
  movimentacao_futura: { icon: ArrowUpDown, color: "text-blue-500" },
};

const horizonteLabels: Record<FiltroHorizonte, string> = {
  hoje: "Hoje",
  "7d": "7 dias",
  "15d": "15 dias",
  "30d": "30 dias",
  mes: "Mês atual",
  todos: "Todos",
};

// ─── Helpers de filtro ────────────────────────────────────────────────────────

function filtrarPorHorizonte(items: CompromissoItem[], horizonte: FiltroHorizonte): CompromissoItem[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (horizonte === "todos") return items;

  return items.filter((item) => {
    const d = new Date(item.dataVencimento);
    const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (horizonte === "hoje") return itemDay.getTime() === today.getTime() || item.status === "vencido";
    if (horizonte === "7d") {
      const limit = new Date(today); limit.setDate(limit.getDate() + 7);
      return itemDay <= limit;
    }
    if (horizonte === "15d") {
      const limit = new Date(today); limit.setDate(limit.getDate() + 15);
      return itemDay <= limit;
    }
    if (horizonte === "30d") {
      const limit = new Date(today); limit.setDate(limit.getDate() + 30);
      return itemDay <= limit;
    }
    if (horizonte === "mes") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return true;
  });
}

function agrupar(items: CompromissoItem[], campo: AgrupamentoCampo): Map<string, CompromissoItem[]> {
  const map = new Map<string, CompromissoItem[]>();
  for (const item of items) {
    let key: string;
    if (campo === "data") key = fmtDayMonth(item.dataVencimento);
    else if (campo === "categoria") key = item.categoria ?? "Sem categoria";
    else key = tipoLabel(item.tipo);

    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

// ─── Saldo previsto (running balance) ────────────────────────────────────────

function calcSaldoPrevisto(items: CompromissoItem[], saldoInicial: number): Map<string, number> {
  const map = new Map<string, number>();
  let saldo = saldoInicial;
  for (const item of items) {
    if (!item.pago) {
      saldo = item.isEntrada ? saldo + item.valor : saldo - item.valor;
    }
    map.set(item.id, saldo);
  }
  return map;
}

// ─── Componentes ─────────────────────────────────────────────────────────────

function AlertasBanner({ data }: { data: ProximosCompromissosData }) {
  if (data.totalVencido === 0 && data.totalProximo === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {data.totalVencido > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-500/5 px-4 py-3 dark:border-red-800/60">
          <AlertCircle className="size-4 shrink-0 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">{fmt(data.totalVencido)}</span> em compromissos vencidos e não pagos.
          </span>
        </div>
      )}
      {data.totalProximo > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-500/5 px-4 py-3 dark:border-amber-800/60">
          <AlertTriangle className="size-4 shrink-0 text-amber-500" />
          <span className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">{fmt(data.totalProximo)}</span> vencem nos próximos 7 dias.
          </span>
        </div>
      )}
    </div>
  );
}

function CompromissoRow({
  item,
  saldoApos,
  saldoAtual,
}: {
  item: CompromissoItem;
  saldoApos: number;
  saldoAtual: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[item.status];
  const tipoCfg = tipoConfig[item.tipo];
  const TipoIcon = tipoCfg.icon;

  return (
    <div className={cn("border-b border-border last:border-0", item.status === "vencido" && "bg-red-500/3")}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        {/* Ícone do tipo */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <TipoIcon className={cn("size-4", tipoCfg.color)} />
        </div>

        {/* Info principal */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{item.descricao}</p>
            <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {item.categoria ?? tipoLabel(item.tipo)} · {fmtDate(item.dataVencimento)}
          </p>
        </div>

        {/* Valor e saldo previsto */}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            item.isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
          )}>
            {item.isEntrada ? "+" : "−"}{fmt(item.valor)}
          </span>
          <span className={cn(
            "text-[11px] tabular-nums",
            saldoApos >= 0 ? "text-muted-foreground" : "text-red-500"
          )}>
            → {fmt(saldoApos)}
          </span>
        </div>

        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="border-t border-border/50 bg-muted/20 px-5 py-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium">{tipoLabel(item.tipo)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vencimento</p>
              <p className="font-medium">{fmtDate(item.dataVencimento)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Saldo antes</p>
              <p className={cn("font-medium tabular-nums", saldoAtual >= 0 ? "" : "text-red-500")}>{fmt(saldoAtual)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Saldo após</p>
              <p className={cn("font-medium tabular-nums", saldoApos >= 0 ? "" : "text-red-500")}>{fmt(saldoApos)}</p>
            </div>
            {item.formaPagamento && (
              <div>
                <p className="text-muted-foreground">Pagamento</p>
                <p className="font-medium">{item.formaPagamento}</p>
              </div>
            )}
          </div>
          <div className="mt-3">
            <Link
              href={item.origem.href}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              <ExternalLink className="size-3" />
              {item.origem.label}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CompromissosClient({ data }: { data: ProximosCompromissosData }) {
  const [horizonte, setHorizonte] = useState<FiltroHorizonte>("30d");
  const [agrupamento, setAgrupamento] = useState<AgrupamentoCampo>("data");
  const [mostrarPagos, setMostrarPagos] = useState(false);

  const filtrados = useMemo(() => {
    let items = filtrarPorHorizonte(data.compromissos, horizonte);
    if (!mostrarPagos) items = items.filter((i) => !i.pago);
    return items;
  }, [data.compromissos, horizonte, mostrarPagos]);

  const grupos = useMemo(() => agrupar(filtrados, agrupamento), [filtrados, agrupamento]);
  const saldoPrevisto = useMemo(
    () => calcSaldoPrevisto(filtrados, data.saldoAtual),
    [filtrados, data.saldoAtual]
  );

  // Saldo "antes" de cada item (saldo após o item anterior)
  const saldoAntes = useMemo(() => {
    const map = new Map<string, number>();
    let saldo = data.saldoAtual;
    for (const item of filtrados) {
      map.set(item.id, saldo);
      if (!item.pago) {
        saldo = item.isEntrada ? saldo + item.valor : saldo - item.valor;
      }
    }
    return map;
  }, [filtrados, data.saldoAtual]);

  const totalFiltrado = filtrados
    .filter((i) => !i.pago && !i.isEntrada)
    .reduce((acc, i) => acc + i.valor, 0);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Título */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Próximos Compromissos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Linha do tempo das suas obrigações financeiras
        </p>
      </div>

      {/* Alertas */}
      <AlertasBanner data={data} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Saldo atual</p>
          <p className={cn("mt-1 text-lg font-bold tabular-nums", data.saldoAtual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {fmt(data.saldoAtual)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total pendente</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{fmt(data.totalPendente)}</p>
        </div>
        <div className={cn("rounded-xl border bg-card p-4", data.totalVencido > 0 ? "border-red-300 dark:border-red-800/60" : "border-border")}>
          <p className="text-xs text-muted-foreground">Vencidos</p>
          <p className={cn("mt-1 text-lg font-bold tabular-nums", data.totalVencido > 0 ? "text-red-600 dark:text-red-400" : "text-foreground")}>
            {fmt(data.totalVencido)}
          </p>
        </div>
        <div className={cn("rounded-xl border bg-card p-4", data.totalProximo > 0 ? "border-amber-300 dark:border-amber-800/60" : "border-border")}>
          <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
          <p className={cn("mt-1 text-lg font-bold tabular-nums", data.totalProximo > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
            {fmt(data.totalProximo)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Horizonte */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(Object.keys(horizonteLabels) as FiltroHorizonte[]).map((h) => (
            <button
              key={h}
              onClick={() => setHorizonte(h)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                horizonte === h
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {horizonteLabels[h]}
            </button>
          ))}
        </div>

        {/* Agrupamento */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="size-3.5" />
          <span>Agrupar por:</span>
          {(["data", "categoria", "tipo"] as AgrupamentoCampo[]).map((a) => (
            <button
              key={a}
              onClick={() => setAgrupamento(a)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                agrupamento === a
                  ? "border-foreground/30 bg-foreground/8 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {a === "data" ? "Data" : a === "categoria" ? "Categoria" : "Tipo"}
            </button>
          ))}
        </div>

        {/* Mostrar pagos */}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={mostrarPagos}
            onChange={(e) => setMostrarPagos(e.target.checked)}
            className="rounded"
          />
          Mostrar pagos
        </label>
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CheckCircle2 className="size-10 text-emerald-500/40" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum compromisso no período</p>
            <p className="text-xs text-muted-foreground">Tente ampliar o filtro de horizonte.</p>
          </div>
        ) : (
          <>
            {[...grupos.entries()].map(([grupo, itens]) => (
              <div key={grupo}>
                {/* Cabeçalho do grupo */}
                <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{grupo}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {fmt(itens.filter((i) => !i.isEntrada && !i.pago).reduce((acc, i) => acc + i.valor, 0))}
                  </span>
                </div>
                {/* Itens */}
                {itens.map((item) => (
                  <CompromissoRow
                    key={item.id}
                    item={item}
                    saldoApos={saldoPrevisto.get(item.id) ?? data.saldoAtual}
                    saldoAtual={saldoAntes.get(item.id) ?? data.saldoAtual}
                  />
                ))}
              </div>
            ))}

            {/* Rodapé com total do filtro */}
            <div className="border-t border-border bg-muted/20 px-5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total no período</span>
                <span className="font-bold tabular-nums">{fmt(totalFiltrado)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
