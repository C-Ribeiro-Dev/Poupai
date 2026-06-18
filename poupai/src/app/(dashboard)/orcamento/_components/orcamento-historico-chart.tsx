"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";

export interface HistoricoMes {
  mes: string;
  planejado: number;
  gasto: number;
}

const GRID = "rgba(128,128,128,0.15)";
const AXIS = "#9ca3af";

function cap(v: string) {
  return v ? v[0].toUpperCase() + v.slice(1).split(" ")[0] : v;
}

function fmtK(v: number) {
  if (v === 0) return "0";
  return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
}

function Tooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const planejado = (payload.find((p: any) => p.dataKey === "planejado")?.value ?? 0) as number;
  const gasto = (payload.find((p: any) => p.dataKey === "gasto")?.value ?? 0) as number;
  const pct = planejado > 0 ? (gasto / planejado) * 100 : 0;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium capitalize">{label}</p>
      <p className="tabular-nums text-muted-foreground">
        Planejado: {formatCurrency(planejado)}
      </p>
      <p className={`tabular-nums font-medium ${pct > 100 ? "text-red-600 dark:text-red-400" : pct >= 80 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
        Gasto: {formatCurrency(gasto)} ({pct.toFixed(0)}%)
      </p>
    </div>
  );
}

interface Props {
  historico: HistoricoMes[];
}

export function OrcamentoHistoricoChart({ historico }: Props) {
  const temDados = historico.some((m) => m.planejado > 0 || m.gasto > 0);
  if (!temDados || historico.length < 2) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">Histórico de orçamentos</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">Planejado vs gasto — últimos 6 meses</p>
      <div className="mt-4 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={historico} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis
              dataKey="mes"
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
            <RechartsTooltip content={<Tooltip />} cursor={{ fill: "rgba(128,128,128,0.08)" }} />
            <Bar dataKey="planejado" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} name="Planejado" />
            <Bar dataKey="gasto" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} name="Gasto" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex justify-center gap-5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-indigo-500" />
          <span className="text-xs text-muted-foreground">Planejado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-red-500" />
          <span className="text-xs text-muted-foreground">Gasto</span>
        </div>
      </div>
    </div>
  );
}
