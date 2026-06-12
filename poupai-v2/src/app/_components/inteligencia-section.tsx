import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  PiggyBank,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { getInteligencia } from "@/services/inteligencia";
import type { InsightTom } from "@/services/inteligencia";

const tomConfig: Record<InsightTom, { icon: React.ElementType; cls: string }> = {
  positivo: { icon: TrendingUp, cls: "bg-emerald-500/10 text-emerald-500" },
  negativo: { icon: TrendingDown, cls: "bg-red-500/10 text-red-500" },
  alerta: { icon: AlertTriangle, cls: "bg-amber-500/10 text-amber-500" },
  neutro: { icon: Lightbulb, cls: "bg-blue-500/10 text-blue-500" },
};

export async function InteligenciaSection({ userId }: { userId: string }) {
  const data = await getInteligencia(userId);

  // Sem dados suficientes, não exibe a seção
  if (data.frases.length === 0 && data.score === 0) return null;

  const R = 42;
  const C = 2 * Math.PI * R;
  const scoreColor =
    data.score >= 80
      ? "stroke-emerald-500 text-emerald-600 dark:text-emerald-400"
      : data.score >= 60
        ? "stroke-blue-500 text-blue-600 dark:text-blue-400"
        : data.score >= 40
          ? "stroke-amber-400 text-amber-600 dark:text-amber-400"
          : "stroke-red-500 text-red-600 dark:text-red-400";

  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Brain className="size-4" />
        Inteligência financeira
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Score de saúde financeira */}
        <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
          <svg viewBox="0 0 100 100" className="size-24 shrink-0" role="img" aria-label="Saúde financeira">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(data.score / 100) * C} ${C}`}
              transform="rotate(-90 50 50)"
              className={scoreColor.split(" ")[0]}
            />
            <text x="50" y="47" textAnchor="middle" className="fill-foreground text-xl font-bold">
              {data.score}
            </text>
            <text x="50" y="64" textAnchor="middle" className="fill-muted-foreground text-[9px]">
              de 100
            </text>
          </svg>
          <div>
            <p className="text-sm text-muted-foreground">Saúde financeira</p>
            <p className={cn("text-xl font-bold", scoreColor.split(" ").slice(1).join(" "))}>
              {data.nivel}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Baseado em poupança, orçamento, contas em dia, investimentos e metas.
            </p>
          </div>
        </div>

        {/* Taxa de poupança */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <PiggyBank className="size-4 text-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">Taxa de poupança</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums">
            {data.taxaPoupanca !== null ? `${data.taxaPoupanca.toFixed(0)}%` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {data.taxaPoupanca !== null
              ? data.taxaPoupancaAnterior !== null
                ? `mês passado: ${data.taxaPoupancaAnterior.toFixed(0)}%`
                : "da renda deste mês"
              : "registre receitas para calcular"}
          </p>
        </div>

        {/* FIRE */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="size-4 text-orange-500" />
            </div>
            <span className="text-sm text-muted-foreground">Independência financeira</span>
          </div>
          {data.fire ? (
            <>
              <p className="mt-3 text-2xl font-bold tabular-nums">
                {data.fire.percentualFIRE.toFixed(1)}%
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                patrimônio cobre {data.fire.mesesCobertos.toFixed(1)}{" "}
                {data.fire.mesesCobertos >= 2 ? "meses" : "mês"} de despesas (
                {formatCurrency(data.fire.despesaMediaMensal)}/mês)
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-2xl font-bold tabular-nums">—</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                registre investimentos para acompanhar
              </p>
            </>
          )}
        </div>
      </div>

      {/* Frases de insight */}
      {data.frases.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {data.frases.map((f, i) => {
              const cfg = tomConfig[f.tom];
              const Icon = cfg.icon;
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                      cfg.cls
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <p className="text-sm leading-relaxed">{f.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
