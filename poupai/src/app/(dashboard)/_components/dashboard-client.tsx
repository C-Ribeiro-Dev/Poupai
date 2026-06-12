"use client";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Repeat2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCompactCurrency, formatDate } from "@/lib/format";
import type {
  DashboardResumoMes,
  DashboardInsights,
  DashboardOrcamento,
  DashboardMeta,
  DashboardProjecao,
} from "@/types/dashboard";
import type { AnalyticsMesSerie } from "@/services/analytics";

interface MovRecente {
  id: number;
  descricao: string | null;
  tipoNome: string;
  categoria: string | null;
  valor: number;
  isEntrada: boolean;
  data: string;
  isFixaOuDiaria: boolean;
}

interface ProxVencimento {
  id: number;
  nome: string;
  valor: number;
  isEntrada: boolean;
  dataVencimento: string;
  categoria: string | null;
  formaPagamento: string | null;
}

interface ContaResumo {
  id: number;
  nome: string;
  cor: string;
  saldoAtual: number;
}

interface DashboardClientProps {
  resumoMes: DashboardResumoMes;
  saldoTotal: number;
  projecao: DashboardProjecao;
  fixasPendentes: number;
  fixasPagas: number;
  fixasVencidas: number;
  mes: string;
  insights: DashboardInsights;
  orcamento: DashboardOrcamento | null;
  metas: DashboardMeta[];
  ultimasMovimentacoes: MovRecente[];
  proximosVencimentos: ProxVencimento[];
  tendencia: AnalyticsMesSerie[];
  saldoConsolidado: number;
  contas: ContaResumo[];
  totalFaturas: number;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.fill }}>
          {p.name === "receitas" ? "Receitas" : "Despesas"}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

export function DashboardClient({
  resumoMes,
  saldoTotal,
  projecao,
  fixasPendentes,
  fixasPagas,
  fixasVencidas,
  mes,
  insights,
  orcamento,
  metas,
  ultimasMovimentacoes,
  proximosVencimentos,
  tendencia,
  saldoConsolidado,
  contas,
  totalFaturas,
}: DashboardClientProps) {
  const saldoPositivo = resumoMes.saldo >= 0;
  const mesCapitalized = mes.charAt(0).toUpperCase() + mes.slice(1);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm text-muted-foreground">{greeting()} 👋</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {mesCapitalized}
        </h1>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Saldo do mês */}
        <div className={cn(
          "col-span-2 rounded-xl border p-5 lg:col-span-1",
          saldoPositivo
            ? "border-emerald-500/20 bg-emerald-500/5"
            : "border-red-500/20 bg-red-500/5"
        )}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Saldo do mês</p>
            <div className={cn(
              "flex size-7 items-center justify-center rounded-lg",
              saldoPositivo ? "bg-emerald-500/15" : "bg-red-500/15"
            )}>
              {saldoPositivo
                ? <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                : <TrendingDown className="size-3.5 text-red-600 dark:text-red-400" />}
            </div>
          </div>
          <p className={cn(
            "mt-2 text-2xl font-bold tabular-nums",
            saldoPositivo ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCompactCurrency(resumoMes.saldo)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {saldoPositivo ? "positivo este mês" : "negativo este mês"}
          </p>
        </div>

        {/* Receitas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Receitas</p>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCompactCurrency(resumoMes.receitas)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">entradas no mês</p>
        </div>

        {/* Despesas */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Despesas</p>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowDownRight className="size-3.5 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
            {formatCompactCurrency(resumoMes.despesas)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">saídas no mês</p>
        </div>

        {/* Fatura cartão */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Fatura aberta</p>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15">
              <CreditCard className="size-3.5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="mt-2 text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {formatCompactCurrency(totalFaturas)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">a pagar nos cartões</p>
        </div>
      </div>

      {/* ── Gráfico + Fixas + Saldo Contas ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Tendência 6 meses */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Receitas vs Despesas</p>
            <span className="text-xs text-muted-foreground">últimos 6 meses</span>
          </div>
          {tendencia.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={tendencia} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactCurrency(v).replace("R$ ", "")}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 4 }} />
                <Bar dataKey="receitas" name="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="despesas" name="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
              Sem dados suficientes ainda.
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-emerald-500" />
              Receitas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-sm bg-red-500" />
              Despesas
            </span>
          </div>
        </div>

        {/* Painel direito: Fixas + Saldo Contas */}
        <div className="flex flex-col gap-4">
          {/* Movimentações fixas */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Mov. Fixas</p>
              <Link href="/movimentacoes-fixas" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                Ver <ChevronRight className="size-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-3">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fixasPagas}</span>
                <span className="text-center text-xs text-muted-foreground">Pagas</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-3">
                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
                <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{fixasPendentes}</span>
                <span className="text-center text-xs text-muted-foreground">Pendentes</span>
              </div>
              <div className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-3",
                fixasVencidas > 0 ? "bg-red-500/10" : "bg-muted/50"
              )}>
                <AlertCircle className={cn("size-4", fixasVencidas > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")} />
                <span className={cn("text-lg font-bold tabular-nums", fixasVencidas > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>{fixasVencidas}</span>
                <span className="text-center text-xs text-muted-foreground">Vencidas</span>
              </div>
            </div>
          </div>

          {/* Saldo das contas */}
          {contas.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Contas</p>
                <Link href="/contas" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                  Ver <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="flex flex-col gap-2">
                {contas.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: c.cor }}
                      />
                      <span className="truncate text-sm">{c.nome}</span>
                    </div>
                    <span className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      c.saldoAtual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {formatCompactCurrency(c.saldoAtual)}
                    </span>
                  </div>
                ))}
                {contas.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{contas.length - 3} contas</p>
                )}
              </div>
              <div className="mt-3 border-t border-border pt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Saldo total</span>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  saldoConsolidado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {formatCurrency(saldoConsolidado)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Movimentações + Vencimentos ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Últimas movimentações */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Últimas movimentações</p>
            <Link href="/movimentacoes" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
              Ver todas <ChevronRight className="size-3" />
            </Link>
          </div>
          {ultimasMovimentacoes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {ultimasMovimentacoes.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    m.isEntrada ? "bg-emerald-500/10" : "bg-red-500/10"
                  )}>
                    {m.isFixaOuDiaria
                      ? <Repeat2 className={cn("size-3.5", m.isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")} />
                      : m.isEntrada
                        ? <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                        : <ArrowDownRight className="size-3.5 text-red-600 dark:text-red-400" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.descricao ?? m.tipoNome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.categoria ?? m.tipoNome} · {formatDate(new Date(m.data))}
                    </p>
                  </div>
                  <span className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    m.isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {m.isEntrada ? "+" : "-"}{formatCompactCurrency(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Próximos vencimentos */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Próximos vencimentos</p>
              <Link href="/movimentacoes-fixas" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                Ver <ChevronRight className="size-3" />
              </Link>
            </div>
            {proximosVencimentos.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">Nenhum vencimento próximo.</p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {proximosVencimentos.map((v) => {
                  const dias = Math.ceil(
                    (new Date(v.dataVencimento).getTime() - Date.now()) / 86400000
                  );
                  const urgente = dias <= 3;
                  return (
                    <div key={v.id} className="flex items-center gap-3 py-2.5">
                      <div className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        urgente ? "bg-red-500/10" : "bg-amber-500/10"
                      )}>
                        <CalendarClock className={cn("size-3.5", urgente ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{v.nome}</p>
                        <p className={cn(
                          "text-xs",
                          urgente ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                        )}>
                          {dias === 0 ? "Vence hoje" : dias < 0 ? `Venceu há ${Math.abs(dias)} dias` : `Em ${dias} dias · ${formatDate(new Date(v.dataVencimento))}`}
                        </p>
                      </div>
                      <span className={cn(
                        "shrink-0 text-sm font-semibold tabular-nums",
                        v.isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      )}>
                        {formatCompactCurrency(v.valor)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Insights */}
          {(insights.topGasto || insights.topReceita) && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-violet-500" />
                <p className="text-sm font-semibold">Destaques do mês</p>
              </div>
              <div className="flex flex-col gap-2">
                {insights.topGasto && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-red-500/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="size-3.5 text-red-500" />
                      <span className="text-xs text-muted-foreground">Maior gasto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{insights.topGasto.categoria}</span>
                      <span className="text-xs font-bold tabular-nums text-red-600 dark:text-red-400">
                        {formatCompactCurrency(insights.topGasto.valor)}
                      </span>
                    </div>
                  </div>
                )}
                {insights.topReceita && (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-500/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="size-3.5 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Maior receita</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{insights.topReceita.categoria}</span>
                      <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCompactCurrency(insights.topReceita.valor)}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  {insights.totalLancamentos} lançamentos este mês
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Metas + Orçamento ── */}
      {(metas.length > 0 || orcamento) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Metas */}
          {metas.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Metas em andamento</p>
                <Link href="/metas" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                  Ver todas <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                {metas.slice(0, 3).map((m) => (
                  <div key={m.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Target className="size-3.5 shrink-0" style={{ color: m.cor }} />
                        <span className="truncate text-sm font-medium">{m.nome}</span>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: m.cor }}>
                        {Math.round(m.percentual)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(m.percentual, 100)}%`,
                          backgroundColor: m.cor,
                        }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{formatCompactCurrency(m.totalAportado)}</span>
                      <span>{formatCompactCurrency(m.valorAlvo)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orçamento */}
          {orcamento && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Orçamento do mês</p>
                <Link href="/orcamento" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground">
                  Ver <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gasto</span>
                  <span className="font-semibold tabular-nums">{formatCompactCurrency(orcamento.totalGasto)}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      orcamento.totalGasto / orcamento.totalPlanejado > 1
                        ? "bg-red-500"
                        : orcamento.totalGasto / orcamento.totalPlanejado > 0.8
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    )}
                    style={{
                      width: `${Math.min((orcamento.totalGasto / orcamento.totalPlanejado) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round((orcamento.totalGasto / orcamento.totalPlanejado) * 100)}% do planejado</span>
                  <span>de {formatCompactCurrency(orcamento.totalPlanejado)}</span>
                </div>
              </div>
              {orcamento.categoriasEstouradas.length > 0 && (
                <div className="rounded-lg bg-red-500/8 px-3 py-2">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    ⚠️ Estouradas: {orcamento.categoriasEstouradas.join(", ")}
                  </p>
                </div>
              )}
              {orcamento.categoriasEmAtencao.length > 0 && (
                <div className="mt-2 rounded-lg bg-amber-500/8 px-3 py-2">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Atenção: {orcamento.categoriasEmAtencao.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Projeção ── */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Wallet className="size-4 text-violet-500" />
          <p className="text-sm font-semibold">Projeção do mês</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Saldo projetado</p>
            <p className={cn(
              "mt-0.5 text-lg font-bold tabular-nums",
              projecao.saldoProjetado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {formatCompactCurrency(projecao.saldoProjetado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receitas pendentes</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              +{formatCompactCurrency(projecao.receitasPendentes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Despesas pendentes</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
              -{formatCompactCurrency(projecao.despesasPendentes)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
