"use client";
import { useState } from "react";
import { Plus, PiggyBank, Pencil, Trash2, AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { CategoriaRow } from "@/types/categorias";
import type { OrcamentoRow, OrcamentoStatus } from "@/types/orcamentos";
import type { OrcamentosData } from "@/services/orcamentos";
import { getCategoriaIcon } from "@/lib/categorias-config";
import { OrcamentoFormDialog } from "./orcamento-form-dialog";
import { DeleteOrcamentoDialog } from "./delete-orcamento-dialog";
import { OrcamentoHistoricoChart, type HistoricoMes } from "./orcamento-historico-chart";

const statusConfig: Record<
  OrcamentoStatus,
  { label: string; icon: React.ElementType; badge: string; bar: string }
> = {
  ok: {
    label: "Dentro do orçamento",
    icon: CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  atencao: {
    label: "Quase no limite",
    icon: TriangleAlert,
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    bar: "bg-amber-400",
  },
  estourado: {
    label: "Estourado",
    icon: AlertCircle,
    badge: "bg-red-500/15 text-red-700 dark:text-red-400",
    bar: "bg-red-500",
  },
};

interface OrcamentoClientProps {
  data: OrcamentosData;
  categorias: CategoriaRow[];
  historico: HistoricoMes[];
}

export function OrcamentoClient({ data, categorias, historico }: OrcamentoClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<OrcamentoRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<OrcamentoRow | null>(null);

  const { orcamentos, resumo, mes } = data;
  const pctGeral =
    resumo.totalPlanejado > 0 ? (resumo.totalGasto / resumo.totalPlanejado) * 100 : 0;
  const geralEstourado = pctGeral >= 100;

  // Categorias de saída sem orçamento ainda (para o form de criação)
  const categoriasDisponiveis = categorias.filter(
    (c) =>
      c.ativo &&
      c.tipo !== "entrada" &&
      !orcamentos.some((o) => o.categoria === c.nome)
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Orçamento</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Limites de gasto por categoria em {mes}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Novo orçamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Resumo geral */}
      {orcamentos.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Visão geral do mês</span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                geralEstourado
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
              )}
            >
              {formatCurrency(resumo.totalGasto)} de {formatCurrency(resumo.totalPlanejado)}
            </span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                geralEstourado ? "bg-red-500" : pctGeral >= 80 ? "bg-amber-400" : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(pctGeral, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{pctGeral.toFixed(0)}% usado</span>
            <span
              className={cn(
                resumo.totalDisponivel < 0 && "font-medium text-red-600 dark:text-red-400"
              )}
            >
              {resumo.totalDisponivel >= 0
                ? `${formatCurrency(resumo.totalDisponivel)} disponíveis`
                : `${formatCurrency(Math.abs(resumo.totalDisponivel))} acima do planejado`}
            </span>
          </div>
        </div>
      )}

      {/* Histórico */}
      <OrcamentoHistoricoChart historico={historico} />

      {/* Empty state */}
      {orcamentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <PiggyBank className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium">Nenhum orçamento definido</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Defina quanto pretende gastar por categoria e acompanhe em tempo real quanto já
              foi usado no mês.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
            <Plus className="size-4" />
            Criar primeiro orçamento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orcamentos.map((o) => {
            const Icon = getCategoriaIcon(o.icone);
            const cfg = statusConfig[o.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={o.id}
                className={cn(
                  "group rounded-xl border bg-card p-4 transition-colors",
                  o.status === "estourado"
                    ? "border-red-300 dark:border-red-800/60"
                    : "border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${o.cor}22` }}
                  >
                    <Icon className="size-4.5" style={{ color: o.cor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.categoria}</p>
                    <span
                      className={cn(
                        "mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                        cfg.badge
                      )}
                    >
                      <StatusIcon className="size-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditItem(o)}
                      aria-label={`Editar orçamento de ${o.categoria}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteItem(o)}
                      aria-label={`Excluir orçamento de ${o.categoria}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all", cfg.bar)}
                    style={{ width: `${Math.min(o.percentual, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(o.gasto)}{" "}
                    <span className="text-muted-foreground/60">
                      / {formatCurrency(o.valor)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      o.status === "estourado"
                        ? "text-red-600 dark:text-red-400"
                        : o.status === "atencao"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {o.percentual.toFixed(0)}%
                  </span>
                </div>
                {o.disponivel < 0 && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {formatCurrency(Math.abs(o.disponivel))} acima do limite
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <OrcamentoFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categoriasDisponiveis={categoriasDisponiveis}
      />
      <OrcamentoFormDialog
        open={!!editItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditItem(null);
        }}
        orcamento={editItem}
        categoriasDisponiveis={categoriasDisponiveis}
      />
      <DeleteOrcamentoDialog
        open={!!deleteItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteItem(null);
        }}
        orcamento={deleteItem}
      />
    </div>
  );
}
