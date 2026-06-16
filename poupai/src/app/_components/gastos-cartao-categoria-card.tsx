import Link from "next/link";
import { CreditCard, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GastosCartaoCategoriaData } from "@/services/gastos-cartao-categoria";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtCompact = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });

// Paleta de cores para as barras (indigo brand → variações)
const BAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
];

const PERIODO_LABEL: Record<GastosCartaoCategoriaData["periodo"], string> = {
  "3m": "3 meses",
  "6m": "6 meses",
  "12m": "12 meses",
  total: "todo período",
};

export function GastosCartaoCategoriaCard({ data }: { data: GastosCartaoCategoriaData }) {
  const { categorias, totalGeral, periodo } = data;

  return (
    <div className="flex flex-col rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard className="size-4 text-indigo-500" />
          <span className="text-sm font-semibold">Gastos no cartão por categoria</span>
        </div>
        <Link
          href="/cartoes"
          className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Ver cartões
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-4">
        {categorias.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma compra no cartão ainda.</p>
            <Link href="/cartoes" className="mt-1 text-xs text-primary underline-offset-2 hover:underline">
              Registrar compra
            </Link>
          </div>
        ) : (
          <>
            {/* Total + período */}
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold tabular-nums">{fmt(totalGeral)}</p>
              <span className="text-xs text-muted-foreground">últimos {PERIODO_LABEL[periodo]}</span>
            </div>

            {/* Barra empilhada */}
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {categorias.map((cat, i) => (
                <div
                  key={cat.categoria}
                  className={cn("h-full transition-all", BAR_COLORS[i % BAR_COLORS.length])}
                  style={{ width: `${cat.percentual}%` }}
                  title={`${cat.categoria}: ${cat.percentual.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Lista de categorias */}
            <div className="space-y-2.5">
              {categorias.map((cat, i) => (
                <div key={cat.categoria} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "mt-0.5 size-2 shrink-0 rounded-full",
                      BAR_COLORS[i % BAR_COLORS.length]
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{cat.categoria}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {cat.percentual.toFixed(0)}%
                        </span>
                        <span className="min-w-16 text-right text-sm font-semibold tabular-nums">
                          {fmtCompact(cat.total)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", BAR_COLORS[i % BAR_COLORS.length])}
                        style={{ width: `${cat.percentual}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Maior categoria em destaque */}
            {categorias[0] && (
              <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Maior gasto:{" "}
                  <span className="font-semibold text-foreground">{categorias[0].categoria}</span>
                  {" "}representa{" "}
                  <span className="font-semibold text-foreground">
                    {categorias[0].percentual.toFixed(0)}%
                  </span>
                  {" "}do total de compras no cartão.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
