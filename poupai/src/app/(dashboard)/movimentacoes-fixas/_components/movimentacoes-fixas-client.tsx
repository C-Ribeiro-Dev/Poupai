"use client";
import { useState, useTransition, useMemo } from "react";
import {
  Plus,
  Search,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Minus,
  Pencil,
  Trash2,
  Eye,
  Undo2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  SkipForward,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import {
  type MovimentacaoFixaRow,
  type MovimentacaoFixaStatus,
  getMovimentacaoFixaStatus,
} from "@/types/movimentacoes-fixas";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import {
  desmarcarPagamentoAction,
  batchMarcarComoPagoAction,
  batchPularCicloAction,
} from "@/actions/movimentacoes-fixas";
import { MovimentacaoFixaFormDialog } from "./movimentacao-fixa-form-dialog";
import { DeleteMovimentacaoFixaDialog } from "./delete-movimentacao-fixa-dialog";
import { MovimentacaoFixaDetailDialog } from "./movimentacao-fixa-detail-dialog";
import { PagarDialog } from "./pagar-dialog";
import { RecorrentesSugestoes } from "./recorrentes-sugestoes";
import type { RecorrenteSugestao } from "@/services/recorrentes";

const formatVencimento = (row: MovimentacaoFixaRow): string => {
  if (row.diaVencimento) return `Dia ${row.diaVencimento}`;
  if (row.dataVencimento) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(row.dataVencimento));
  }
  return "—";
};

const statusConfig: Record<
  MovimentacaoFixaStatus,
  { label: string; icon: React.ElementType; className: string }
> = {
  pago: {
    label: "Pago",
    icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  pendente: {
    label: "Pendente",
    icon: Clock,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  vencido: {
    label: "Vencido",
    icon: AlertCircle,
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  inativo: {
    label: "Inativo",
    icon: Minus,
    className: "bg-foreground/10 text-muted-foreground",
  },
};

function StatusBadge({ status }: { status: MovimentacaoFixaStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        cfg.className
      )}
    >
      <Icon className="size-3 shrink-0" />
      {cfg.label}
    </span>
  );
}

type FilterStatus = "todos" | "ativas" | MovimentacaoFixaStatus;
type FilterDirection = "todos" | "entrada" | "saida";
type SortOption = "recentes" | "antigos" | "maior" | "menor" | "nome";

const SORT_LABELS: Record<SortOption, string> = {
  recentes: "Mais recentes",
  antigos: "Mais antigos",
  maior: "Maior valor",
  menor: "Menor valor",
  nome: "Nome (A–Z)",
};

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "todos", label: "Todos os status" },
  { value: "ativas", label: "Ativas" },
  { value: "pendente", label: "Pendente" },
  { value: "vencido", label: "Vencido" },
  { value: "pago", label: "Pago" },
  { value: "inativo", label: "Inativo" },
];

const DIRECTION_OPTIONS: { value: FilterDirection; label: string }[] = [
  { value: "todos", label: "Entrada e saída" },
  { value: "entrada", label: "Apenas entradas" },
  { value: "saida", label: "Apenas saídas" },
];

interface MovimentacoesFixasClientProps {
  movimentacoesFixas: MovimentacaoFixaRow[];
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  initialSearch?: string;
  sugestoesRecorrentes?: RecorrenteSugestao[];
}

export function MovimentacoesFixasClient({
  movimentacoesFixas,
  tipos,
  categorias,
  initialSearch,
  sugestoesRecorrentes = [],
}: MovimentacoesFixasClientProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("todos");
  const [filterDirection, setFilterDirection] = useState<FilterDirection>("todos");
  const [sortOption, setSortOption] = useState<SortOption>("recentes");

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MovimentacaoFixaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MovimentacaoFixaRow | null>(null);
  const [detailTarget, setDetailTarget] = useState<MovimentacaoFixaRow | null>(null);
  const [pagarTarget, setPagarTarget] = useState<MovimentacaoFixaRow | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [desmarcarPendingId, setDesmarcarPendingId] = useState<number | null>(null);
  const [, startDesmarcar] = useTransition();
  const [batchPayPending, startBatchPay] = useTransition();
  const [batchSkipPending, startBatchSkip] = useTransition();

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(m: MovimentacaoFixaRow) {
    setEditTarget(m);
    setFormOpen(true);
  }

  function handleDesmarcar(m: MovimentacaoFixaRow) {
    setDesmarcarPendingId(m.id);
    startDesmarcar(async () => {
      const result = await desmarcarPagamentoAction(m.id);
      setDesmarcarPendingId(null);
      if (result.success) toast.success("Pagamento desmarcado.");
      else toast.error(result.error);
    });
  }

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingInFiltered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pendingInFiltered.forEach((m) => next.add(m.id));
        return next;
      });
    }
  }

  function toggleSelectOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBatchPay() {
    const ids = [...selectedIds];
    startBatchPay(async () => {
      const result = await batchMarcarComoPagoAction(ids);
      setSelectedIds(new Set());
      if (result.success) {
        toast.success(`${ids.length} pagamento${ids.length > 1 ? "s" : ""} registrado${ids.length > 1 ? "s" : ""}.`, {
          description: "Movimentações criadas em Movimentações.",
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleBatchSkip() {
    const ids = [...selectedIds];
    startBatchSkip(async () => {
      const result = await batchPularCicloAction(ids);
      setSelectedIds(new Set());
      if (result.success) {
        toast.success(`${ids.length} ciclo${ids.length > 1 ? "s" : ""} pulado${ids.length > 1 ? "s" : ""}.`, {
          description: "Sem movimentações criadas.",
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  const filtered = useMemo(() => {
    return movimentacoesFixas.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          m.nome.toLowerCase().includes(q) ||
          m.tipoNome.toLowerCase().includes(q) ||
          (m.categoria?.toLowerCase().includes(q) ?? false);
        if (!match) return false;
      }

      if (filterDirection === "entrada" && !m.isEntrada) return false;
      if (filterDirection === "saida" && m.isEntrada) return false;

      if (filterStatus === "ativas") {
        if (!m.ativo) return false;
      } else if (filterStatus !== "todos") {
        const status = getMovimentacaoFixaStatus(m);
        if (status !== filterStatus) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortOption) {
        case "antigos":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "maior":
          return b.valor - a.valor;
        case "menor":
          return a.valor - b.valor;
        case "nome":
          return a.nome.localeCompare(b.nome, "pt-BR");
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [movimentacoesFixas, search, filterDirection, filterStatus, sortOption]);

  const summary = useMemo(() => {
    const ativas = movimentacoesFixas.filter(
      (m) => getMovimentacaoFixaStatus(m) !== "inativo"
    );
    const entradas = ativas
      .filter((m) => m.isEntrada)
      .reduce((acc, m) => acc + m.valor, 0);
    const saidas = ativas
      .filter((m) => !m.isEntrada)
      .reduce((acc, m) => acc + m.valor, 0);
    const pendentes = ativas.filter((m) => getMovimentacaoFixaStatus(m) !== "pago");
    const vencidas = ativas.filter((m) => getMovimentacaoFixaStatus(m) === "vencido");
    return { entradas, saidas, pendentes: pendentes.length, vencidas: vencidas.length };
  }, [movimentacoesFixas]);

  const hasActiveFilters =
    search.trim() !== "" || filterStatus !== "todos" || filterDirection !== "todos";

  const pendingInFiltered = filtered.filter(
    (m) => getMovimentacaoFixaStatus(m) !== "pago" && getMovimentacaoFixaStatus(m) !== "inativo" && m.ativo
  );
  const allPendingSelected =
    pendingInFiltered.length > 0 && pendingInFiltered.every((m) => selectedIds.has(m.id));
  const somePendingSelected = pendingInFiltered.some((m) => selectedIds.has(m.id));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Movimentações Fixas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gerencie suas receitas e despesas recorrentes
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova movimentação fixa</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Sugestões de gastos recorrentes */}
      <RecorrentesSugestoes sugestoes={sugestoesRecorrentes} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-muted-foreground">Entradas fixas</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.entradas)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">por mês (ativas)</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
              <ArrowDownRight className="size-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm text-muted-foreground">Saídas fixas</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
            {formatCurrency(summary.saidas)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">por mês (ativas)</p>
        </div>

        <div
          className={cn(
            "rounded-xl border bg-card p-4",
            summary.vencidas > 0 ? "border-red-300 dark:border-red-800" : "border-border"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                summary.vencidas > 0 ? "bg-red-500/10" : "bg-amber-500/10"
              )}
            >
              <TrendingDown
                className={cn(
                  "size-4",
                  summary.vencidas > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              />
            </div>
            <span className="text-sm text-muted-foreground">Pendentes</span>
          </div>
          <p
            className={cn(
              "mt-3 text-2xl font-bold tabular-nums",
              summary.vencidas > 0
                ? "text-red-600 dark:text-red-400"
                : "text-amber-600 dark:text-amber-400"
            )}
          >
            {summary.pendentes}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.vencidas > 0
              ? `${summary.vencidas} vencida${summary.vencidas > 1 ? "s" : ""}`
              : "aguardando pagamento"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <FloatingInput
            label=""
            className="pl-9"
            placeholder="Buscar por nome, tipo, categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="w-44">
            <FloatingCombobox
              label="Todos os status"
              options={STATUS_OPTIONS}
              value={filterStatus}
              onChange={(v) => setFilterStatus((v || "todos") as FilterStatus)}
            />
          </div>

          <div className="w-44">
            <FloatingCombobox
              label="Entrada e saída"
              options={DIRECTION_OPTIONS}
              value={filterDirection}
              onChange={(v) => setFilterDirection((v || "todos") as FilterDirection)}
            />
          </div>

          <div className="w-44">
            <FloatingCombobox
              label="Ordenar por"
              options={(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => ({
                value: opt,
                label: SORT_LABELS[opt],
              }))}
              value={sortOption}
              onChange={(v) => setSortOption((v || "recentes") as SortOption)}
            />
          </div>
        </div>
      </div>

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300/50 bg-emerald-500/5 px-4 py-2.5 dark:border-emerald-800/50">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            {selectedIds.size} {selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs"
            >
              Limpar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchSkip}
              disabled={batchSkipPending || batchPayPending}
              className="h-7 border-indigo-300 text-xs text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              <SkipForward className="size-3.5" />
              Pular ciclo
            </Button>
            <Button
              size="sm"
              onClick={handleBatchPay}
              disabled={batchPayPending || batchSkipPending}
              className="h-7 border-emerald-300 bg-emerald-600 text-xs text-white hover:bg-emerald-700 dark:border-emerald-800 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <CheckCircle2 className="size-3.5" />
              Pagar selecionados
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {movimentacoesFixas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CalendarCheck className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Nenhuma movimentação fixa cadastrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre suas receitas e despesas recorrentes para ter um controle completo.
            </p>
          </div>
          <Button onClick={openCreate} size="sm" variant="outline">
            <Plus className="size-4" />
            Nova movimentação fixa
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <Search className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma movimentação fixa encontrada para os filtros aplicados.
          </p>
          <button
            className="text-xs text-primary underline-offset-2 hover:underline"
            onClick={() => {
              setSearch("");
              setFilterStatus("todos");
              setFilterDirection("todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 px-3 py-3">
                    <Checkbox
                      checked={allPendingSelected}
                      indeterminate={somePendingSelected && !allPendingSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar pendentes"
                      disabled={pendingInFiltered.length === 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valor</th>
                  <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => {
                  const status = getMovimentacaoFixaStatus(m);
                  const isDesmarcarPending = desmarcarPendingId === m.id;
                  const isPending = status !== "pago" && status !== "inativo" && m.ativo;
                  return (
                    <tr
                      key={m.id}
                      className={cn("group bg-card transition-colors hover:bg-muted/40", selectedIds.has(m.id) && "bg-muted/50")}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={selectedIds.has(m.id)}
                          onCheckedChange={() => isPending && toggleSelectOne(m.id)}
                          aria-label="Selecionar"
                          disabled={!isPending}
                        />
                      </td>

                      {/* Nome */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{m.nome}</span>
                          {m.categoria && (
                            <span className="text-xs text-muted-foreground">{m.categoria}</span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                              m.isEntrada
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-red-500/15 text-red-700 dark:text-red-400"
                            )}
                          >
                            {m.isEntrada ? "E" : "S"}
                          </span>
                          <span className="text-muted-foreground">{m.tipoNome}</span>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "font-medium tabular-nums",
                            m.isEntrada
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          )}
                        >
                          {formatCurrency(m.valor)}
                        </span>
                      </td>

                      {/* Vencimento */}
                      <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                        {formatVencimento(m)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botão Pagar (visível quando ativo e não pago) */}
                          {m.ativo && status !== "pago" && status !== "inativo" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 border-emerald-300 px-2 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                              onClick={() => setPagarTarget(m)}
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span className="hidden sm:inline">Pagar</span>
                            </Button>
                          )}

                          {/* Desfazer pagamento (visível quando pago) */}
                          {status === "pago" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-muted-foreground hover:text-foreground"
                              disabled={isDesmarcarPending}
                              onClick={() => handleDesmarcar(m)}
                            >
                              <Undo2 className="size-3.5" />
                              <span className="sr-only">Desfazer pagamento</span>
                            </Button>
                          )}

                          {/* Visualizar */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 transition-opacity md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                            onClick={() => setDetailTarget(m)}
                          >
                            <Eye className="size-3.5" />
                            <span className="sr-only">Visualizar</span>
                          </Button>

                          {/* Editar */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 transition-opacity md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>

                          {/* Excluir */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive transition-opacity hover:text-destructive md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                            onClick={() => setDeleteTarget(m)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasActiveFilters && (
            <div className="border-t border-border px-4 py-2 text-center">
              <button
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setSearch("");
                  setFilterStatus("todos");
                  setFilterDirection("todos");
                }}
              >
                Limpar filtros — exibindo {filtered.length} de {movimentacoesFixas.length}{" "}
                movimentações fixas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <MovimentacaoFixaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        movimentacaoFixa={editTarget}
        tipos={tipos}
        categorias={categorias}
      />
      <DeleteMovimentacaoFixaDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        movimentacaoFixa={deleteTarget}
      />
      <MovimentacaoFixaDetailDialog
        open={detailTarget !== null}
        onOpenChange={(open) => !open && setDetailTarget(null)}
        movimentacaoFixa={detailTarget}
      />
      <PagarDialog
        open={pagarTarget !== null}
        onOpenChange={(open) => !open && setPagarTarget(null)}
        movimentacaoFixa={pagarTarget}
      />
    </div>
  );
}
