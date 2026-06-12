"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Eye,
  Repeat2,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MovimentacaoFormDialog } from "./movimentacao-form-dialog";
import { DeleteMovimentacaoDialog } from "./delete-movimentacao-dialog";
import { MovimentacaoDetailDialog } from "./movimentacao-detail-dialog";
import type { MovimentacaoRow } from "@/types/movimentacoes";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";

type SortField = "data" | "valor";
type PeriodPreset = "all" | "week" | "month" | "year" | "custom";
type DirectionFilter = "all" | "entrada" | "saida";

interface SortConfig {
  field: SortField;
  order: "asc" | "desc";
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  all: "Tudo",
  week: "Semana",
  month: "Mês",
  year: "Ano",
  custom: "Personalizado",
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

function getPeriodRange(
  preset: PeriodPreset,
  custom: { start: string; end: string }
): { start: Date | null; end: Date | null } {
  const now = new Date();
  switch (preset) {
    case "week": {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end: null };
    }
    case "month":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: null };
    case "custom": {
      const start = custom.start ? new Date(custom.start + "T00:00:00") : null;
      const end = custom.end ? new Date(custom.end + "T23:59:59") : null;
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: "entrada" | "saida" | "saldo";
}) {
  const isNegativeSaldo = variant === "saldo" && value < 0;
  const colorClass =
    variant === "entrada" || (variant === "saldo" && !isNegativeSaldo)
      ? "bg-emerald-500/10 ring-emerald-500/20"
      : "bg-red-500/10 ring-red-500/20";
  const iconClass =
    variant === "entrada" || (variant === "saldo" && !isNegativeSaldo)
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";
  const valueClass =
    variant === "entrada" || (variant === "saldo" && !isNegativeSaldo)
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-red-700 dark:text-red-300";

  return (
    <div className={cn("flex items-center gap-3 rounded-xl p-4 ring-1", colorClass)}>
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/50 dark:bg-black/10",
          iconClass
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn("text-lg font-semibold leading-tight tabular-nums", valueClass)}>
          {formatCurrency(Math.abs(value))}
        </p>
      </div>
    </div>
  );
}

function SortButton({
  field,
  label,
  sort,
  onSort,
}: {
  field: SortField;
  label: string;
  sort: SortConfig;
  onSort: (field: SortField) => void;
}) {
  const isActive = sort.field === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      {isActive ? (
        sort.order === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-50" />
      )}
    </button>
  );
}

interface MovimentacoesClientProps {
  movimentacoes: MovimentacaoRow[];
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  initialSearch?: string;
  isAdmin?: boolean;
}

export function MovimentacoesClient({
  movimentacoes,
  tipos,
  categorias,
  initialSearch,
  isAdmin,
}: MovimentacoesClientProps) {
  // Com busca vinda da URL (busca global), inicia em "Tudo" para não esconder resultados antigos
  const [period, setPeriod] = useState<PeriodPreset>(initialSearch ? "all" : "month");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [search, setSearch] = useState(initialSearch ?? "");
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [tipoIdFilter, setTipoIdFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [sort, setSort] = useState<SortConfig>({ field: "data", order: "desc" });

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<MovimentacaoRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<MovimentacaoRow | null>(null);
  const [detailItem, setDetailItem] = useState<MovimentacaoRow | null>(null);

  // Categorias disponíveis para o filtro: cadastradas + legadas presentes nos dados
  const categoriaOptions = useMemo(() => {
    const nomes = new Set(categorias.filter((c) => c.ativo).map((c) => c.nome));
    for (const m of movimentacoes) {
      if (m.categoria) nomes.add(m.categoria);
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [categorias, movimentacoes]);

  const filtered = useMemo(() => {
    const { start, end } = getPeriodRange(period, customDates);
    const term = search.toLowerCase().trim();
    const tipoId = tipoIdFilter ? Number(tipoIdFilter) : null;

    const list = movimentacoes.filter((m) => {
      const date = new Date(m.data);
      if (start && date < start) return false;
      if (end && date > end) return false;
      if (direction === "entrada" && !m.isEntrada) return false;
      if (direction === "saida" && m.isEntrada) return false;
      if (tipoId !== null && m.tipoId !== tipoId) return false;
      if (categoriaFilter === "__sem__") {
        if (m.categoria) return false;
      } else if (categoriaFilter && m.categoria !== categoriaFilter) {
        return false;
      }
      if (term) {
        const haystack = [m.tipoNome, m.categoria, m.descricao]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const diff =
        sort.field === "data"
          ? new Date(a.data).getTime() - new Date(b.data).getTime()
          : a.valor - b.valor;
      return sort.order === "asc" ? diff : -diff;
    });
  }, [movimentacoes, period, customDates, search, direction, tipoIdFilter, categoriaFilter, sort]);

  const summary = useMemo(() => {
    const entradas = filtered
      .filter((m) => m.isEntrada)
      .reduce((sum, m) => sum + m.valor, 0);
    const saidas = filtered
      .filter((m) => !m.isEntrada)
      .reduce((sum, m) => sum + m.valor, 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtered]);

  const hasActiveFilters =
    search || direction !== "all" || tipoIdFilter || categoriaFilter || period !== "all";

  function toggleSort(field: SortField) {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Movimentações</h1>
        <p className="text-sm text-muted-foreground">
          Registre e acompanhe suas entradas e saídas.
        </p>
      </div>

      {/* Period filter tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        {(["all", "week", "month", "year", "custom"] as PeriodPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              period === p
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {period === "custom" && (
          <div className="ml-2 flex shrink-0 items-center gap-2">
            <input
              type="date"
              value={customDates.start}
              onChange={(e) =>
                setCustomDates((d) => ({ ...d, start: e.target.value }))
              }
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring dark:bg-input/30"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={customDates.end}
              onChange={(e) =>
                setCustomDates((d) => ({ ...d, end: e.target.value }))
              }
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring dark:bg-input/30"
            />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Entradas" value={summary.entradas} icon={TrendingUp} variant="entrada" />
        <SummaryCard label="Saídas" value={summary.saidas} icon={TrendingDown} variant="saida" />
        <SummaryCard label="Saldo" value={summary.saldo} icon={Scale} variant="saldo" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tipo, categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Direction filter */}
          <div className="flex overflow-hidden rounded-lg border border-input">
            {(["all", "entrada", "saida"] as DirectionFilter[]).map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  i > 0 && "border-l border-input",
                  direction === d
                    ? d === "entrada"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : d === "saida"
                      ? "bg-red-500/15 text-red-700 dark:text-red-400"
                      : "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {d === "all" ? "Todos" : d === "entrada" ? "Entrada" : "Saída"}
              </button>
            ))}
          </div>

          {/* Tipo filter */}
          {tipos.length > 0 && (
            <select
              value={tipoIdFilter}
              onChange={(e) => setTipoIdFilter(e.target.value)}
              aria-label="Filtrar por tipo"
              className={cn(
                "h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs",
                "text-muted-foreground outline-none transition-colors",
                "focus:border-ring focus:text-foreground dark:bg-input/30",
                tipoIdFilter && "text-foreground"
              )}
            >
              <option value="">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          )}

          {/* Categoria filter */}
          {categoriaOptions.length > 0 && (
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              aria-label="Filtrar por categoria"
              className={cn(
                "h-8 rounded-lg border border-input bg-transparent px-2.5 text-xs",
                "text-muted-foreground outline-none transition-colors",
                "focus:border-ring focus:text-foreground dark:bg-input/30",
                categoriaFilter && "text-foreground"
              )}
            >
              <option value="">Todas as categorias</option>
              <option value="__sem__">Sem categoria</option>
              {categoriaOptions.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/movimentacoes/importar"
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
          >
            <Upload className="size-3.5" />
            <span className="hidden sm:inline">Importar</span>
          </Link>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova movimentação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left">
                  <SortButton field="data" label="Data" sort={sort} onSort={toggleSort} />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Tipo / Categoria
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                  Descrição
                </th>
                <th className="px-4 py-2.5 text-right">
                  <div className="flex justify-end">
                    <SortButton field="valor" label="Valor" sort={sort} onSort={toggleSort} />
                  </div>
                </th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <Scale className="size-9 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {hasActiveFilters
                          ? "Nenhuma movimentação encontrada para este filtro"
                          : "Nenhuma movimentação registrada"}
                      </p>
                      {!hasActiveFilters && (
                        <p className="text-xs text-muted-foreground">
                          Clique em{" "}
                          <span className="font-medium text-foreground">
                            Nova movimentação
                          </span>{" "}
                          para começar.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="group/row transition-colors hover:bg-muted/30">
                    {/* Date */}
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDate(m.data)}
                    </td>

                    {/* Type + Category */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                            m.isEntrada
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : "bg-red-500/15 text-red-700 dark:text-red-400"
                          )}
                        >
                          {m.tipoNome}
                        </span>
                        {m.categoria && (
                          <span className="text-xs text-muted-foreground">
                            {m.categoria}
                          </span>
                        )}
                        {m.isFixaOuDiaria && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
                            <Repeat2 className="size-3" />
                            Fixa
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="hidden max-w-[200px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                      {m.descricao || <span className="opacity-40">—</span>}
                    </td>

                    {/* Value */}
                    <td
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums",
                        m.isEntrada
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      )}
                    >
                      {m.isEntrada ? "+" : "−"}
                      {formatCurrency(m.valor)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover/row:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDetailItem(m)}
                          aria-label="Visualizar movimentação"
                        >
                          <Eye className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditItem(m)}
                          aria-label="Editar movimentação"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteItem(m)}
                          aria-label="Excluir movimentação"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer counter */}
        {filtered.length > 0 && (
          <div className="border-t bg-muted/20 px-4 py-2.5">
            <p className="text-xs text-muted-foreground">
              {filtered.length}{" "}
              {filtered.length === 1
                ? "movimentação encontrada"
                : "movimentações encontradas"}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDirection("all");
                    setTipoIdFilter("");
                    setCategoriaFilter("");
                    setPeriod("month");
                    setCustomDates({ start: "", end: "" });
                  }}
                  className="ml-2 text-foreground underline-offset-2 hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <MovimentacaoFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tipos={tipos}
        categorias={categorias}
      />
      <MovimentacaoFormDialog
        open={!!editItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditItem(null);
        }}
        movimentacao={editItem}
        tipos={tipos}
        categorias={categorias}
      />
      <DeleteMovimentacaoDialog
        open={!!deleteItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeleteItem(null);
        }}
        movimentacao={deleteItem}
        isAdmin={isAdmin}
      />
      <MovimentacaoDetailDialog
        open={!!detailItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDetailItem(null);
        }}
        movimentacao={detailItem}
      />
    </div>
  );
}
