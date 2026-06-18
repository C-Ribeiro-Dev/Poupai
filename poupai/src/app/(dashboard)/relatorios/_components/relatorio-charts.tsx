"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface LinhaMes {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface LinhaCategoria {
  categoria: string;
  valor: number;
  percentual: number;
}

interface RelatorioChartsProps {
  fluxoMensal: LinhaMes[];
  despesasPorCategoria: LinhaCategoria[];
}

const PIE_COLORS = [
  "#6366f1", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
  "#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f97316",
];
const GRID = "rgba(128,128,128,0.15)";
const AXIS = "#9ca3af";

function cap(v: string) {
  return v ? v[0].toUpperCase() + v.slice(1).split(" ")[0] : v;
}

function fmtK(v: number) {
  if (v === 0) return "0";
  const abs = Math.abs(v);
  return abs >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
}

export function RelatorioCharts({ fluxoMensal, despesasPorCategoria }: RelatorioChartsProps) {
  const temFluxo = fluxoMensal.length > 1;
  const temCategorias = despesasPorCategoria.length > 0;
  if (!temFluxo && !temCategorias) return null;

  const cats = despesasPorCategoria.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      {temFluxo && (
        <>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Receitas vs Despesas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Comparativo mês a mês</p>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fluxoMensal} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={cap}
                  />
                  <YAxis
                    tickFormatter={fmtK}
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <RechartsTooltip
                    content={<FluxoTooltip />}
                    cursor={{ fill: "rgba(128,128,128,0.08)" }}
                  />
                  <Bar dataKey="receitas" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={32} name="Receitas" />
                  <Bar dataKey="despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex justify-center gap-5">
              <LegendDot color="#22c55e" label="Receitas" />
              <LegendDot color="#ef4444" label="Despesas" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Evolução do saldo líquido</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Saldo mês a mês no período</p>
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fluxoMensal} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={cap}
                  />
                  <YAxis
                    tickFormatter={fmtK}
                    tick={{ fontSize: 11, fill: AXIS }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <RechartsTooltip content={<SaldoTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#6366f1", strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#6366f1" }}
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {temCategorias && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Gastos por categoria</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Distribuição das despesas no período</p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-52 w-full shrink-0 sm:w-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cats}
                    dataKey="valor"
                    nameKey="categoria"
                    cx="50%"
                    cy="50%"
                    innerRadius="38%"
                    outerRadius="68%"
                    paddingAngle={2}
                  >
                    {cats.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v: unknown) => [formatCurrency(Number(v)), ""]}
                    contentStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {cats.map((c, i) => (
                <div key={c.categoria} className="flex items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                    {c.categoria}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {c.percentual.toFixed(1)}%
                  </span>
                  <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums">
                    {formatCurrency(c.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FluxoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium capitalize">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }} className="tabular-nums">
          {p.name}: {formatCurrency(p.value as number)}
        </p>
      ))}
    </div>
  );
}

function SaldoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as LinhaMes;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium capitalize">{label}</p>
      <p className="tabular-nums text-emerald-600 dark:text-emerald-400">
        Receitas: {formatCurrency(d.receitas)}
      </p>
      <p className="tabular-nums text-red-600 dark:text-red-400">
        Despesas: {formatCurrency(d.despesas)}
      </p>
      <p
        className={`font-semibold tabular-nums ${
          d.saldo >= 0 ? "text-indigo-500" : "text-red-600 dark:text-red-400"
        }`}
      >
        Saldo: {formatCurrency(d.saldo)}
      </p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
