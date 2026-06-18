"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Upload,
  Download,
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
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import { Checkbox } from "@/components/ui/checkbox";
import { MovimentacaoFormDialog } from "./movimentacao-form-dialog";
import { DeleteMovimentacaoDialog } from "./delete-movimentacao-dialog";
import { BatchDeleteDialog } from "./batch-delete-dialog";
import { MovimentacaoDetailDialog } from "./movimentacao-detail-dialog";
import type { MovimentacaoRow } from "@/types/movimentacoes";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import type { ContaRow } from "@/types/contas";

type SortField = "data" | "valor";
type PeriodPreset = "all" | "today" | "week" | "month" | "year" | "custom";
type DirectionFilter = "all" | "entrada" | "saida";

interface SortConfig {
  field: SortField;
  order: "asc" | "desc";
}

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  all: "Tudo",
  today: "Hoje",
  week: "Semana",
  month: "Mês",
  year: "Ano",
  custom: "Personalizado",
};

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
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
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
  total: number;
  page: number;
  totalPages: number;
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  contas: ContaRow[];
  isAdmin?: boolean;
}

export function MovimentacoesClient({
  movimentacoes,
  total,
  page,
  totalPages,
  tipos,
  categorias,
  contas,
  isAdmin,
}: MovimentacoesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filtros derivados da URL
  const urlQ = searchParams.get("q") ?? "";
  const period = (searchParams.get("period") as PeriodPreset) || (urlQ ? "all" : "month");
  const customDates = {
    start: searchParams.get("start") ?? "",
    end: searchParams.get("end") ?? "",
  };
  const direction = (searchParams.get("dir") as DirectionFilter) || "all";
  const tipoIdFilter = searchParams.get("tipo") ?? "";
  const categoriaFilter = searchParams.get("cat") ?? "";
  const sort: SortConfig = {
    field: (searchParams.get("sort") as SortField) || "data",
    order: (searchParams.get("order") as "asc" | "desc") || "desc",
  };

  // Busca tem estado local para o input (responsivo) + debounce para URL
  const [search, setSearch] = useState(urlQ);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza input de busca quando URL muda externamente (ex: botão voltar)
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  // Estado apenas de UI (sem URL)
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<MovimentacaoRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<MovimentacaoRow | null>(null);
  const [detailItem, setDetailItem] = useState<MovimentacaoRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      updateParams({ q: value || null, page: null });
    }, 300);
  }

  function handlePeriodChange(p: PeriodPreset) {
    const update: Record<string, string | null> = { period: p === "month" ? null : p, page: null };
    if (p !== "custom") { update.start = null; update.end = null; }
    updateParams(update);
  }

  function handleCustomDateChange(field: "start" | "end", value: string) {
    updateParams({ [field]: value || null, page: null });
  }

  // Categorias disponíveis para o filtro: cadastradas + legadas presentes nos dados
  const categoriaOptions = useMemo(() => {
    const nomes = new Set(categorias.filter((c) => c.ativo).map((c) => c.nome));
    for (const m of movimentacoes) {
      if (m.categoria) nomes.add(m.categoria);
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [categorias, movimentacoes]);

  // Data is pre-filtered and paginated server-side
  const filtered = movimentacoes;

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
    const newOrder = sort.field === field && sort.order === "asc" ? "desc" : "asc";
    updateParams({
      sort: field === "data" ? null : field,
      order: newOrder === "desc" ? null : newOrder,
      page: null,
    });
  }

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));
  const someFilteredSelected = filtered.some((m) => selectedIds.has(m.id));

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.add(m.id));
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

  function exportToCsv() {
    const headers = ["Data", "Tipo", "Direção", "Categoria", "Descrição", "Valor"];
    const rows = filtered.map((m) => [
      formatDate(m.data),
      m.tipoNome,
      m.isEntrada ? "Entrada" : "Saída",
      m.categoria ?? "",
      m.descricao ?? "",
      m.isEntrada ? m.valor : -m.valor,
    ]);
    const content = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `movimentacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        {(["all", "today", "week", "month", "year", "custom"] as PeriodPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handlePeriodChange(p)}
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
              onChange={(e) => handleCustomDateChange("start", e.target.value)}
              className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring dark:bg-input/30"
            />
            <span className="text-xs text-muted-foreground">—</span>
            <input
              type="date"
              value={customDates.end}
              onChange={(e) => handleCustomDateChange("end", e.target.value)}
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
            <FloatingInput
              label=""
              placeholder="Buscar tipo, categoria..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Direction filter */}
          <div className="flex overflow-hidden rounded-lg border border-input">
            {(["all", "entrada", "saida"] as DirectionFilter[]).map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => updateParams({ dir: d === "all" ? null : d, page: null })}
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
            <div className="w-40">
              <FloatingCombobox
                label="Todos os tipos"
                options={tipos.map((t) => ({ value: String(t.id), label: t.nome }))}
                value={tipoIdFilter}
                onChange={(v) => updateParams({ tipo: v || null, page: null })}
              />
            </div>
          )}

          {/* Categoria filter */}
          {categoriaOptions.length > 0 && (
            <div className="w-44">
              <FloatingCombobox
                label="Todas as categorias"
                options={[
                  { value: "__sem__", label: "Sem categoria" },
                  ...categoriaOptions.map((nome) => ({ value: nome, label: nome })),
                ]}
                value={categoriaFilter}
                onChange={(v) => updateParams({ cat: v || null, page: null })}
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          {filtered.length > 0 && (
            <button
              type="button"
              onClick={exportToCsv}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
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

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
          <span className="text-sm font-medium text-destructive">
            {selectedIds.size} {selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="h-7 text-xs"
            >
              Limpar seleção
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBatchDeleteOpen(true)}
              className="h-7 text-xs"
            >
              <Trash2 className="size-3.5" />
              Excluir selecionados
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected && !allFilteredSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Selecionar todos"
                  />
                </th>
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
                <th className="w-28 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
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
                  <tr key={m.id} className={cn("group/row transition-colors hover:bg-muted/30", selectedIds.has(m.id) && "bg-muted/50")}>
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selectedIds.has(m.id)}
                        onCheckedChange={() => toggleSelectOne(m.id)}
                        aria-label="Selecionar movimentação"
                      />
                    </td>
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

        {/* Footer — counter + pagination */}
        <div className="border-t bg-muted/20 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {total === 0 ? (
                "Nenhuma movimentação encontrada"
              ) : (
                <>
                  {totalPages > 1
                    ? `Página ${page} de ${totalPages} · `
                    : ""}
                  {total}{" "}
                  {total === 1 ? "movimentação" : "movimentações"}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                        updateParams({ q: null, period: null, start: null, end: null, dir: null, tipo: null, cat: null, sort: null, order: null, page: null });
                      }}
                      className="ml-2 text-foreground underline-offset-2 hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </>
              )}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: String(page - 1) })}
                  disabled={page <= 1}
                  className="h-7 px-2 text-xs"
                >
                  Anterior
                </Button>
                <span className="px-2 text-xs tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateParams({ page: String(page + 1) })}
                  disabled={page >= totalPages}
                  className="h-7 px-2 text-xs"
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <MovimentacaoFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        tipos={tipos}
        categorias={categorias}
        contas={contas}
      />
      <MovimentacaoFormDialog
        open={!!editItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditItem(null);
        }}
        movimentacao={editItem}
        tipos={tipos}
        categorias={categorias}
        contas={contas}
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
      <BatchDeleteDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        ids={[...selectedIds]}
        onSuccess={() => setSelectedIds(new Set())}
        isAdmin={isAdmin}
      />
    </div>
  );
}
