"use client";
import { useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  Pencil,
  Trash2,
  ArrowUpDown,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatCompactCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getClasseInfo, type AtivoRow, type InvestimentosData } from "@/types/investimentos";
import { AtivoFormDialog } from "./ativo-form-dialog";
import { DeleteAtivoDialog } from "./delete-ativo-dialog";
import { LancamentosDialog } from "./lancamentos-dialog";

interface InvestimentosClientProps {
  data: InvestimentosData;
}

export function InvestimentosClient({ data }: InvestimentosClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<AtivoRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<AtivoRow | null>(null);
  const [lancamentosItem, setLancamentosItem] = useState<AtivoRow | null>(null);

  const { ativos, totalInvestido, valorAtualTotal, totalProventos, rentabilidadeTotal } = data;
  const rentPositiva = (rentabilidadeTotal ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Investimentos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Carteira, aportes, proventos e evolução patrimonial
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Novo ativo</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {ativos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <LineChart className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium">Nenhum ativo cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre seus investimentos (renda fixa, ações, FIIs, cripto...) e registre
              aportes para acompanhar seu patrimônio.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
            <Plus className="size-4" />
            Cadastrar primeiro ativo
          </Button>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiMini
              icon={Wallet}
              iconClass="bg-blue-500/10 text-blue-500"
              label="Total investido"
              value={formatCurrency(totalInvestido)}
            />
            <KpiMini
              icon={LineChart}
              iconClass="bg-violet-500/10 text-violet-500"
              label="Valor atual"
              value={formatCurrency(valorAtualTotal)}
            />
            <KpiMini
              icon={rentPositiva ? TrendingUp : TrendingDown}
              iconClass={rentPositiva ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}
              label="Rentabilidade"
              value={
                rentabilidadeTotal !== null
                  ? `${rentPositiva ? "+" : ""}${rentabilidadeTotal.toFixed(1)}%`
                  : "—"
              }
              valueClass={
                rentPositiva
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }
            />
            <KpiMini
              icon={Coins}
              iconClass="bg-amber-500/10 text-amber-500"
              label="Proventos"
              value={formatCurrency(totalProventos)}
            />
          </div>

          {/* Distribuição + Evolução */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Distribuição da carteira</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Por classe de ativo</p>
              {data.distribuicao.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Registre aportes para ver a distribuição.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full">
                    {data.distribuicao.map((d) => (
                      <div
                        key={d.classe}
                        title={`${d.label}: ${formatCurrency(d.valor)} (${d.percentual.toFixed(1)}%)`}
                        style={{ width: `${d.percentual}%`, backgroundColor: d.cor }}
                      />
                    ))}
                  </div>
                  {data.distribuicao.map((d) => (
                    <div key={d.classe} className="flex items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.cor }} />
                      <span className="min-w-0 flex-1 truncate text-xs">{d.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {d.percentual.toFixed(1)}%
                      </span>
                      <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums">
                        {formatCompactCurrency(d.valor)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold">Evolução patrimonial</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Valor aportado acumulado · últimos 12 meses
              </p>
              <EvolucaoChart evolucao={data.evolucao} />
            </div>
          </div>

          {/* Ativos */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ativos.map((a) => {
              const info = getClasseInfo(a.classe);
              const rentPos = (a.rentabilidade ?? 0) >= 0;
              return (
                <div key={a.id} className="group rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${info.cor}22` }}
                    >
                      <LineChart className="size-4.5" style={{ color: info.cor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.nome}</p>
                      <span
                        className="mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: `${info.cor}22`, color: info.cor }}
                      >
                        {info.label}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditItem(a)}
                        aria-label={`Editar ativo ${a.nome}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteItem(a)}
                        aria-label={`Excluir ativo ${a.nome}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(a.valorAtual)}</p>
                      <p className="text-xs text-muted-foreground">
                        aportado: {formatCurrency(a.totalAportado)}
                      </p>
                    </div>
                    {a.rentabilidade !== null && (
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          rentPos
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {rentPos ? "+" : ""}
                        {a.rentabilidade.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setLancamentosItem(a)}
                  >
                    <ArrowUpDown className="size-4" />
                    Movimentações
                  </Button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AtivoFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <AtivoFormDialog
        open={!!editItem}
        onOpenChange={(o) => {
          if (!o) setEditItem(null);
        }}
        ativo={editItem}
      />
      <DeleteAtivoDialog
        open={!!deleteItem}
        onOpenChange={(o) => {
          if (!o) setDeleteItem(null);
        }}
        ativo={deleteItem}
      />
      <LancamentosDialog
        open={!!lancamentosItem}
        onOpenChange={(o) => {
          if (!o) setLancamentosItem(null);
        }}
        ativo={lancamentosItem}
      />
    </div>
  );
}

function KpiMini({
  icon: Icon,
  iconClass,
  label,
  value,
  valueClass,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClass)}>
          <Icon className="size-4" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={cn("mt-3 text-xl font-bold tabular-nums", valueClass)}>{value}</p>
    </div>
  );
}

function EvolucaoChart({ evolucao }: { evolucao: { label: string; valor: number }[] }) {
  const temDados = evolucao.some((e) => e.valor !== 0);
  if (!temDados) {
    return (
      <p className="py-8 text-center text-xs text-muted-foreground">
        Registre aportes para ver a evolução.
      </p>
    );
  }

  const W = 600;
  const H = 150;
  const PAD = 8;
  const valores = evolucao.map((e) => e.valor);
  const minV = Math.min(0, ...valores);
  const maxV = Math.max(0, ...valores);
  const range = maxV - minV || 1;
  const x = (i: number) => (i / (evolucao.length - 1)) * W;
  const y = (v: number) => PAD + ((maxV - v) / range) * (H - PAD * 2);
  const linePath = valores.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(v)}`).join(" ");
  const areaPath = `M 0 ${y(Math.max(minV, 0))} ${valores
    .map((v, i) => `L ${x(i)} ${y(v)}`)
    .join(" ")} L ${W} ${y(Math.max(minV, 0))} Z`;

  return (
    <div className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-32 w-full text-violet-500"
        role="img"
        aria-label="Evolução do patrimônio investido"
      >
        <path d={areaPath} fill="currentColor" opacity="0.12" />
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
        {evolucao
          .filter((_, i) => i % 2 === 0)
          .map((e, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">
              {e.label}
            </span>
          ))}
      </div>
    </div>
  );
}
