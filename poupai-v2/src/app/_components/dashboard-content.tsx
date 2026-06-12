import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Repeat2,
  AlertCircle,
  Clock,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Telescope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentUser, getCurrentUserId } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard";
import { parsePeriodo } from "@/services/analytics";
import type { DashboardData, DashboardProximoVencimento } from "@/types/dashboard";
import { AnalyticsSection } from "./analytics-section";
import { InteligenciaSection } from "./inteligencia-section";

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function getGreeting(name?: string | null): string {
  const hour = new Date().getHours();
  const time = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = name?.trim().split(" ")[0];
  return firstName ? `${time}, ${firstName}` : time;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === -2) return "Anteontem";
  if (diff > -7) return `${Math.abs(diff)} dias atrás`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

type VencimentoUrgency = "vencido" | "hoje" | "urgente" | "normal";

function getVencimentoUrgency(date: Date): VencimentoUrgency {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "vencido";
  if (diff === 0) return "hoje";
  if (diff <= 7) return "urgente";
  return "normal";
}

function formatVencimentoLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return "Vencido";
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff <= 7) return `Em ${diff} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  sublabel?: string;
  className?: string;
}

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor,
  sublabel,
  className,
}: KpiCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center gap-2">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
          <Icon className={cn("size-4", iconColor)} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={cn("mt-3 text-2xl font-bold tabular-nums", valueColor ?? "text-foreground")}>
        {value}
      </p>
      {sublabel && <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}

function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel = "Ver todos",
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <Link
        href={viewAllHref}
        className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
      >
        {viewAllLabel}
      </Link>
    </div>
  );
}

// ─── Próximos Vencimentos ────────────────────────────────────────────────────

const urgencyDot: Record<VencimentoUrgency, string> = {
  vencido: "bg-red-500",
  hoje: "bg-amber-400",
  urgente: "bg-amber-400",
  normal: "bg-foreground/20",
};

const urgencyBadge: Record<VencimentoUrgency, string> = {
  vencido: "bg-red-500/15 text-red-600 dark:text-red-400",
  hoje: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  urgente: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  normal: "bg-foreground/8 text-muted-foreground",
};

function ProximoVencimentoRow({ item }: { item: DashboardProximoVencimento }) {
  const urgency = getVencimentoUrgency(item.dataVencimento);
  const label = formatVencimentoLabel(item.dataVencimento);

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className={cn("mt-0.5 size-2 shrink-0 rounded-full", urgencyDot[urgency])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.nome}</p>
        {item.categoria && (
          <p className="truncate text-xs text-muted-foreground">{item.categoria}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            item.isEntrada
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          )}
        >
          {formatCurrency(item.valor)}
        </span>
        <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", urgencyBadge[urgency])}>
          {label}
        </span>
      </div>
    </div>
  );
}

function EmptyVencimentos() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <CheckCircle2 className="size-8 text-emerald-500/50" />
      <p className="text-sm font-medium text-muted-foreground">Tudo em dia!</p>
      <p className="text-xs text-muted-foreground">Nenhum vencimento próximo.</p>
      <Link
        href="/movimentacoes-fixas"
        className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
      >
        Gerenciar movimentações fixas
      </Link>
    </div>
  );
}

// ─── Últimas Movimentações ───────────────────────────────────────────────────

function MovimentacaoRecenteRow({
  id,
  descricao,
  tipoNome,
  categoria,
  valor,
  isEntrada,
  data,
  isFixaOuDiaria,
}: DashboardData["ultimasMovimentacoes"][number]) {
  const relativeDate = formatRelativeDate(data);

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          isEntrada ? "bg-emerald-500/10" : "bg-foreground/6"
        )}
      >
        {isEntrada ? (
          <ArrowUpRight className="size-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">
            {descricao ?? tipoNome}
          </p>
          {isFixaOuDiaria && (
            <Repeat2 className="size-3 shrink-0 text-muted-foreground/60" />
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {categoria ? `${categoria} · ${relativeDate}` : relativeDate}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 text-sm font-semibold tabular-nums",
          isEntrada
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-foreground"
        )}
      >
        {isEntrada ? "+" : "−"}{formatCurrency(valor)}
      </span>
    </div>
  );
}

function EmptyMovimentacoes() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <Clock className="size-8 text-muted-foreground/30" />
      <p className="text-sm font-medium text-muted-foreground">Nenhuma movimentação</p>
      <p className="text-xs text-muted-foreground">Registre sua primeira transação.</p>
      <Link
        href="/movimentacoes"
        className="mt-1 text-xs text-primary underline-offset-2 hover:underline"
      >
        Adicionar movimentação
      </Link>
    </div>
  );
}

// ─── Período (mês de referência) ─────────────────────────────────────────────

function parseMesParam(mesParam?: string): Date | null {
  if (!mesParam || !/^\d{4}-\d{2}$/.test(mesParam)) return null;
  const [ano, mes] = mesParam.split("-").map(Number);
  if (mes < 1 || mes > 12) return null;
  return new Date(ano, mes - 1, 1);
}

function toMesParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function MesNavegacao({
  mesRef,
  isCurrentMonth,
  periodoParam,
}: {
  mesRef: Date;
  isCurrentMonth: boolean;
  periodoParam?: string;
}) {
  const prev = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
  const next = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(mesRef);
  const labelCapital = label.charAt(0).toUpperCase() + label.slice(1);

  function hrefFor(mes?: Date): string {
    const params = new URLSearchParams();
    if (mes) params.set("mes", toMesParam(mes));
    if (periodoParam) params.set("periodo", periodoParam);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  const navClass =
    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex items-center gap-1">
      <Link href={hrefFor(prev)} className={navClass} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-32 text-center text-sm font-medium tabular-nums">
        {labelCapital}
      </span>
      {!isCurrentMonth ? (
        <Link href={hrefFor(next)} className={navClass} aria-label="Próximo mês">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(navClass, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
      {!isCurrentMonth && (
        <Link
          href={hrefFor()}
          className="ml-1 rounded-md px-2 py-1 text-xs font-medium text-primary underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Mês atual
        </Link>
      )}
    </div>
  );
}

// ─── Dashboard principal ─────────────────────────────────────────────────────

export async function DashboardContent({
  mesParam,
  periodoParam,
}: {
  mesParam?: string;
  periodoParam?: string;
}) {
  const userId = await getCurrentUserId();
  const now = new Date();
  const mesRef = parseMesParam(mesParam) ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const isCurrentMonth =
    mesRef.getFullYear() === now.getFullYear() && mesRef.getMonth() === now.getMonth();
  const periodo = parsePeriodo(periodoParam);

  const [user, data] = await Promise.all([
    getCurrentUser(),
    getDashboardData(userId, mesRef),
  ]);
  const name = user?.user_metadata?.nome as string | undefined;

  const saldoPositivo = data.saldoTotal >= 0;
  const saldoMesPositivo = data.resumoMes.saldo >= 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* ── Greeting + período ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{getGreeting(name)}</h1>
        <MesNavegacao
          mesRef={mesRef}
          isCurrentMonth={isCurrentMonth}
          periodoParam={periodoParam && periodo !== "atual" ? periodo : undefined}
        />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* Saldo Total — destaque */}
        <KpiCard
          className="col-span-2 md:col-span-1"
          icon={Wallet}
          iconBg={saldoPositivo ? "bg-emerald-500/10" : "bg-red-500/10"}
          iconColor={saldoPositivo ? "text-emerald-500" : "text-red-500"}
          label="Saldo total"
          value={formatCurrency(data.saldoTotal)}
          valueColor={
            saldoPositivo
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }
          sublabel="acumulado"
        />

        {/* Receitas do mês */}
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          label="Receitas"
          value={formatCurrency(data.resumoMes.receitas)}
          valueColor="text-emerald-600 dark:text-emerald-400"
          sublabel={`em ${data.mes}`}
        />

        {/* Despesas do mês */}
        <KpiCard
          icon={TrendingDown}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          label="Despesas"
          value={formatCurrency(data.resumoMes.despesas)}
          sublabel={`em ${data.mes}`}
        />

        {/* Fixas pendentes */}
        <KpiCard
          className={
            data.fixasVencidas > 0
              ? "border-red-300 dark:border-red-800/60"
              : ""
          }
          icon={data.fixasVencidas > 0 ? AlertCircle : CalendarClock}
          iconBg={data.fixasVencidas > 0 ? "bg-red-500/10" : "bg-amber-500/10"}
          iconColor={data.fixasVencidas > 0 ? "text-red-500" : "text-amber-500"}
          label="Fixas pendentes"
          value={String(data.fixasPendentes)}
          valueColor={
            data.fixasVencidas > 0
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400"
          }
          sublabel={
            data.fixasVencidas > 0
              ? `${data.fixasVencidas} vencida${data.fixasVencidas > 1 ? "s" : ""}`
              : "aguardando pagamento"
          }
        />

        {/* Fixas pagas */}
        <KpiCard
          icon={CheckCircle2}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          label="Fixas pagas"
          value={String(data.fixasPagas)}
          valueColor="text-emerald-600 dark:text-emerald-400"
          sublabel="neste ciclo"
        />
      </div>

      {/* ── Insights do mês ── */}
      {(data.insights.topGasto ||
        data.insights.topReceita ||
        data.insights.totalLancamentos > 0 ||
        data.orcamento) && (
        <div className="flex flex-wrap gap-2">
          {data.insights.totalLancamentos > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <BarChart2 className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{data.insights.totalLancamentos}</span>{" "}
                lançamento{data.insights.totalLancamentos !== 1 ? "s" : ""} em {data.mes}
              </span>
            </div>
          )}
          {data.insights.topGasto && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <TrendingDown className="size-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">
                Maior gasto:{" "}
                <span className="font-semibold text-foreground">{data.insights.topGasto.categoria}</span>{" "}
                <span className="tabular-nums">({formatCurrency(data.insights.topGasto.valor)})</span>
              </span>
            </div>
          )}
          {data.insights.topReceita && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                Maior receita:{" "}
                <span className="font-semibold text-foreground">{data.insights.topReceita.categoria}</span>{" "}
                <span className="tabular-nums">({formatCurrency(data.insights.topReceita.valor)})</span>
              </span>
            </div>
          )}
          {data.orcamento && data.orcamento.categoriasEstouradas.length > 0 && (
            <Link
              href="/orcamento"
              className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-500/5 px-3 py-2 transition-colors hover:bg-red-500/10 dark:border-red-800/60"
            >
              <AlertCircle className="size-3.5 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400">
                Orçamento estourado:{" "}
                <span className="font-semibold">
                  {data.orcamento.categoriasEstouradas.join(", ")}
                </span>
              </span>
            </Link>
          )}
          {data.orcamento &&
            data.orcamento.categoriasEstouradas.length === 0 &&
            data.orcamento.categoriasEmAtencao.length > 0 && (
              <Link
                href="/orcamento"
                className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-500/5 px-3 py-2 transition-colors hover:bg-amber-500/10 dark:border-amber-800/60"
              >
                <AlertCircle className="size-3.5 text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  Quase no limite:{" "}
                  <span className="font-semibold">
                    {data.orcamento.categoriasEmAtencao.join(", ")}
                  </span>
                </span>
              </Link>
            )}
        </div>
      )}

      {/* ── Saldo do mês (barra) ── */}
      {(data.resumoMes.receitas > 0 || data.resumoMes.despesas > 0) && (
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Resultado de {data.mes}
            </span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                saldoMesPositivo
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {saldoMesPositivo ? "+" : "−"}
              {formatCurrency(Math.abs(data.resumoMes.saldo))}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
              {data.resumoMes.receitas > 0 && data.resumoMes.despesas > 0 && (() => {
                const total = data.resumoMes.receitas + data.resumoMes.despesas;
                const receitasPct = (data.resumoMes.receitas / total) * 100;
                const despesasPct = (data.resumoMes.despesas / total) * 100;
                return (
                  <>
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${receitasPct}%` }}
                    />
                    <div
                      className="absolute right-0 top-0 h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${despesasPct}%` }}
                    />
                  </>
                );
              })()}
              {data.resumoMes.receitas > 0 && data.resumoMes.despesas === 0 && (
                <div className="absolute inset-0 rounded-full bg-emerald-500" />
              )}
              {data.resumoMes.despesas > 0 && data.resumoMes.receitas === 0 && (
                <div className="absolute inset-0 rounded-full bg-red-500" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-emerald-500" />
              Receitas {formatCurrency(data.resumoMes.receitas)}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-red-500" />
              Despesas {formatCurrency(data.resumoMes.despesas)}
            </span>
          </div>
        </div>
      )}

      {/* ── Projeção fim do mês ── */}
      {isCurrentMonth && (data.projecao.receitasPendentes > 0 || data.projecao.despesasPendentes > 0) && (
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10">
              <Telescope className="size-3.5 text-blue-500" />
            </div>
            <span className="text-sm font-semibold">Projeção fim do mês</span>
            <span className="text-xs text-muted-foreground">se pagar todas as fixas pendentes</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Saldo atual</span>
              <span className={cn(
                "text-sm font-semibold tabular-nums",
                data.saldoTotal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(data.saldoTotal)}
              </span>
            </div>
            {data.projecao.despesasPendentes > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Fixas a pagar</span>
                <span className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                  −{formatCurrency(data.projecao.despesasPendentes)}
                </span>
              </div>
            )}
            {data.projecao.receitasPendentes > 0 && (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Receitas fixas</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(data.projecao.receitasPendentes)}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Saldo projetado</span>
              <span className={cn(
                "text-base font-bold tabular-nums",
                data.projecao.saldoProjetado >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(data.projecao.saldoProjetado)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Inteligência financeira ── */}
      <InteligenciaSection userId={userId} />

      {/* ── Analytics ── */}
      <AnalyticsSection userId={userId} periodo={periodo} mesParam={mesParam} />

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Próximos Vencimentos */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <SectionHeader
            title="Próximos vencimentos"
            viewAllHref="/movimentacoes-fixas"
            viewAllLabel="Ver fixas"
          />
          {data.proximosVencimentos.length === 0 ? (
            <EmptyVencimentos />
          ) : (
            <div className="divide-y divide-border">
              {data.proximosVencimentos.map((item) => (
                <ProximoVencimentoRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Últimas Movimentações */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <SectionHeader
            title="Últimas movimentações"
            viewAllHref="/movimentacoes"
            viewAllLabel="Ver todas"
          />
          {data.ultimasMovimentacoes.length === 0 ? (
            <EmptyMovimentacoes />
          ) : (
            <div className="divide-y divide-border">
              {data.ultimasMovimentacoes.map((m) => (
                <MovimentacaoRecenteRow key={m.id} {...m} />
              ))}
            </div>
          )}
        </div>

        {/* Metas em andamento */}
        {data.metas.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
            <SectionHeader title="Metas em andamento" viewAllHref="/metas" viewAllLabel="Ver metas" />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              {data.metas.map((m) => (
                <div key={m.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{m.nome}</p>
                    <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: m.cor }}>
                      {m.percentual.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(m.percentual, 100)}%`,
                        backgroundColor: m.cor,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                    {formatCurrency(m.totalAportado)} de {formatCurrency(m.valorAlvo)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
