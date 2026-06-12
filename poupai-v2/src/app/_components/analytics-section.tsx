import Link from "next/link";
import { BarChart3, PieChart, LineChart, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAnalyticsData,
  PERIODO_LABELS,
  type AnalyticsPeriodo,
  type AnalyticsData,
} from "@/services/analytics";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

// ─── Card base ───────────────────────────────────────────────────────────────

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex flex-1 flex-col justify-end">{children}</div>
    </div>
  );
}

function EmptyChart({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
      <Icon className="size-8 text-muted-foreground/30" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── 1. Receitas x Despesas (barras agrupadas por mês) ──────────────────────

function ReceitasDespesasChart({ meses }: { meses: AnalyticsData["meses"] }) {
  const max = Math.max(...meses.map((m) => Math.max(m.receitas, m.despesas)));
  if (max === 0) {
    return <EmptyChart icon={BarChart3} message="Sem movimentações no período." />;
  }

  return (
    <div>
      <div className="flex h-40 items-end gap-2 sm:gap-3">
        {meses.map((m, i) => (
          <div key={i} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="flex h-full items-end justify-center gap-1"
              title={`${m.label}: receitas ${formatCurrency(m.receitas)} · despesas ${formatCurrency(m.despesas)}`}
            >
              <div
                className="w-full max-w-6 rounded-t-sm bg-emerald-500"
                style={{
                  height: m.receitas > 0 ? `${Math.max((m.receitas / max) * 100, 2)}%` : "0",
                }}
              />
              <div
                className="w-full max-w-6 rounded-t-sm bg-red-500/85"
                style={{
                  height: m.despesas > 0 ? `${Math.max((m.despesas / max) * 100, 2)}%` : "0",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 border-t border-border pt-2 sm:gap-3">
        {meses.map((m, i) => (
          <span key={i} className="flex-1 truncate text-center text-[10px] text-muted-foreground">
            {m.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-emerald-500" />
          Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-red-500/85" />
          Despesas
        </span>
      </div>
    </div>
  );
}

// ─── 2. Distribuição de despesas por categoria ──────────────────────────────

function CategoriaDistribuicaoChart({
  fatias,
  totalDespesas,
}: {
  fatias: AnalyticsData["despesasPorCategoria"];
  totalDespesas: number;
}) {
  if (fatias.length === 0) {
    return <EmptyChart icon={PieChart} message="Sem despesas no período." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Barra empilhada */}
      <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full">
        {fatias.map((f) => (
          <div
            key={f.nome}
            title={`${f.nome}: ${formatCurrency(f.valor)} (${f.percentual.toFixed(1)}%)`}
            style={{ width: `${f.percentual}%`, backgroundColor: f.cor }}
          />
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {fatias.map((f) => (
          <div key={f.nome} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: f.cor }} />
            <span className="min-w-0 flex-1 truncate text-xs">{f.nome}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {f.percentual.toFixed(1)}%
            </span>
            <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums">
              {formatCompact(f.valor)}
            </span>
          </div>
        ))}
      </div>

      <p className="border-t border-border pt-2 text-right text-xs text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{formatCurrency(totalDespesas)}</span>
      </p>
    </div>
  );
}

// ─── 3. Evolução financeira mensal (linha/área SVG) ─────────────────────────

function EvolucaoChart({ meses }: { meses: AnalyticsData["meses"] }) {
  if (meses.length < 2) {
    return (
      <EmptyChart
        icon={LineChart}
        message="Selecione um período maior para ver a evolução mensal."
      />
    );
  }
  const temDados = meses.some((m) => m.receitas > 0 || m.despesas > 0);
  if (!temDados) {
    return <EmptyChart icon={LineChart} message="Sem movimentações no período." />;
  }

  const W = 600;
  const H = 180;
  const PAD = 8;
  const saldos = meses.map((m) => m.saldo);
  const minV = Math.min(0, ...saldos);
  const maxV = Math.max(0, ...saldos);
  const range = maxV - minV || 1;

  const x = (i: number) => (i / (meses.length - 1)) * W;
  const y = (v: number) => PAD + ((maxV - v) / range) * (H - PAD * 2);
  const yZero = y(0);

  const linePath = saldos.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const areaPath = `M 0 ${yZero} ${saldos
    .map((v, i) => `L ${x(i)} ${y(v)}`)
    .join(" ")} L ${W} ${yZero} Z`;

  const saldoFinal = saldos[saldos.length - 1];
  const positivo = saldoFinal >= 0;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className={cn(
          "h-40 w-full",
          positivo ? "text-emerald-500" : "text-red-500"
        )}
        role="img"
        aria-label="Evolução do saldo mensal"
      >
        {/* Linha do zero */}
        <line
          x1="0"
          y1={yZero}
          x2={W}
          y2={yZero}
          stroke="var(--border)"
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        {/* Área */}
        <path d={areaPath} fill="currentColor" opacity="0.12" />
        {/* Linha */}
        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between border-t border-border pt-2">
        {meses.map((m, i) => (
          <span key={i} className="text-[10px] text-muted-foreground">
            {m.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Saldo de cada mês no período</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            positivo
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          Último mês: {formatCurrency(saldoFinal)}
        </span>
      </div>
    </div>
  );
}

// ─── 4. Fixas pagas x pendentes (donut SVG) ─────────────────────────────────

function FixasDonutChart({ fixas }: { fixas: AnalyticsData["fixas"] }) {
  const total = fixas.pagas + fixas.pendentes;
  if (total === 0) {
    return <EmptyChart icon={CircleDollarSign} message="Nenhuma movimentação fixa ativa." />;
  }

  const R = 46;
  const C = 2 * Math.PI * R;
  const pendentesNaoVencidas = fixas.pendentes - fixas.vencidas;

  const segPagas = (fixas.pagas / total) * C;
  const segPendentes = (pendentesNaoVencidas / total) * C;
  const segVencidas = (fixas.vencidas / total) * C;
  const pctPagas = Math.round((fixas.pagas / total) * 100);

  return (
    <div className="flex items-center justify-center gap-6">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0" role="img" aria-label="Fixas pagas x pendentes">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--muted)" strokeWidth="13" />
        <g transform="rotate(-90 60 60)">
          {fixas.pagas > 0 && (
            <circle
              cx="60" cy="60" r={R} fill="none"
              className="stroke-emerald-500"
              strokeWidth="13"
              strokeDasharray={`${segPagas} ${C}`}
            />
          )}
          {pendentesNaoVencidas > 0 && (
            <circle
              cx="60" cy="60" r={R} fill="none"
              className="stroke-amber-400"
              strokeWidth="13"
              strokeDasharray={`${segPendentes} ${C}`}
              strokeDashoffset={-segPagas}
            />
          )}
          {fixas.vencidas > 0 && (
            <circle
              cx="60" cy="60" r={R} fill="none"
              className="stroke-red-500"
              strokeWidth="13"
              strokeDasharray={`${segVencidas} ${C}`}
              strokeDashoffset={-(segPagas + segPendentes)}
            />
          )}
        </g>
        <text
          x="60" y="57"
          textAnchor="middle"
          className="fill-foreground text-xl font-bold"
        >
          {pctPagas}%
        </text>
        <text
          x="60" y="74"
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          pagas
        </text>
      </svg>

      <div className="flex flex-col gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Pagas</span>
          <span className="font-semibold tabular-nums">{fixas.pagas}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-amber-400" />
          <span className="text-muted-foreground">Pendentes</span>
          <span className="font-semibold tabular-nums">{pendentesNaoVencidas}</span>
        </span>
        {fixas.vencidas > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">Vencidas</span>
            <span className="font-semibold tabular-nums">{fixas.vencidas}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Seção principal ─────────────────────────────────────────────────────────

const periodos: AnalyticsPeriodo[] = ["atual", "3m", "6m", "1a"];

export async function AnalyticsSection({
  userId,
  periodo,
  mesParam,
}: {
  userId: string;
  periodo: AnalyticsPeriodo;
  mesParam?: string;
}) {
  const data = await getAnalyticsData(userId, periodo);

  function hrefFor(p: AnalyticsPeriodo): string {
    const params = new URLSearchParams();
    if (p !== "atual") params.set("periodo", p);
    if (mesParam) params.set("mes", mesParam);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header da seção + seletor de período */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Analytics
        </h2>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {periodos.map((p) => (
            <Link
              key={p}
              href={hrefFor(p)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                periodo === p
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {PERIODO_LABELS[p]}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Receitas x Despesas"
          subtitle={
            periodo === "atual" ? "Comparativo do mês atual" : "Comparativo mensal no período"
          }
        >
          <ReceitasDespesasChart meses={data.meses} />
        </ChartCard>

        <ChartCard
          title="Despesas por categoria"
          subtitle="Onde seu dinheiro foi gasto no período"
        >
          <CategoriaDistribuicaoChart
            fatias={data.despesasPorCategoria}
            totalDespesas={data.totalDespesas}
          />
        </ChartCard>

        <ChartCard title="Evolução financeira" subtitle="Saldo mensal ao longo do período">
          <EvolucaoChart meses={data.meses} />
        </ChartCard>

        <ChartCard title="Contas fixas" subtitle="Pagas x pendentes neste ciclo">
          <FixasDonutChart fixas={data.fixas} />
        </ChartCard>
      </div>
    </section>
  );
}
