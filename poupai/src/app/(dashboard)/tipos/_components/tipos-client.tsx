"use client";
import { useState, useMemo, useTransition } from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Tag,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Badge } from "@/components/ui/badge";
import { TipoFormDialog } from "./tipo-form-dialog";
import { DeleteTipoDialog } from "./delete-tipo-dialog";
import { seedTiposPadraoAction } from "@/actions/tipos";
import type { TipoMovimentacaoRow } from "@/types/tipos";

type SortField = "nome" | "createdAt";
type SortOrder = "asc" | "desc";

interface SortConfig {
  field: SortField;
  order: SortOrder;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

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
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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

interface TiposClientProps {
  tipos: TipoMovimentacaoRow[];
  initialSearch?: string;
}

export function TiposClient({ tipos, initialSearch }: TiposClientProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [sort, setSort] = useState<SortConfig>({ field: "createdAt", order: "desc" });
  const [createOpen, setCreateOpen] = useState(false);
  const [editTipo, setEditTipo] = useState<TipoMovimentacaoRow | null>(null);
  const [deleteTipo, setDeleteTipo] = useState<TipoMovimentacaoRow | null>(null);
  const [isPendingSeed, startSeedTransition] = useTransition();

  function handleSeed() {
    startSeedTransition(async () => {
      const result = await seedTiposPadraoAction();
      if (result.success) toast.success("Tipos padrão adicionados com sucesso!");
      else toast.error(result.error);
    });
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    const list = tipos.filter((t) => t.nome.toLowerCase().includes(term));

    return [...list].sort((a, b) => {
      if (sort.field === "nome") {
        const cmp = a.nome.localeCompare(b.nome, "pt-BR");
        return sort.order === "asc" ? cmp : -cmp;
      }
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sort.order === "asc" ? aTime - bTime : bTime - aTime;
    });
  }, [tipos, search, sort]);

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
        <h1 className="text-xl font-semibold tracking-tight">Tipos de Movimentação</h1>
        <p className="text-sm text-muted-foreground">
          Tipos usados para classificar entradas e saídas.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <FloatingInput
            label=""
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={isPendingSeed}>
            {isPendingSeed ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            <span className="hidden sm:inline">Tipos padrão</span>
          </Button>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="size-4" />
            Novo tipo
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
                  <SortButton field="nome" label="Nome" sort={sort} onSort={toggleSort} />
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground md:table-cell">
                  Descrição
                </th>
                <th className="hidden px-4 py-2.5 text-left sm:table-cell">
                  <SortButton
                    field="createdAt"
                    label="Criado em"
                    sort={sort}
                    onSort={toggleSort}
                  />
                </th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                      <Tag className="size-9 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {search
                          ? "Nenhum tipo encontrado para esta busca"
                          : "Nenhum tipo cadastrado"}
                      </p>
                      {!search && (
                        <p className="text-xs text-muted-foreground">
                          Clique em{" "}
                          <span className="font-medium text-foreground">Novo tipo</span>{" "}
                          para começar.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tipo) => (
                  <tr
                    key={tipo.id}
                    className="group/row transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{tipo.nome}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          tipo.isEntrada
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-700 dark:text-red-400"
                        )}
                      >
                        {tipo.isEntrada ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td className="hidden max-w-[260px] truncate px-4 py-3 text-muted-foreground md:table-cell">
                      {tipo.descricao || <span className="opacity-40">—</span>}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {formatDate(tipo.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover/row:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditTipo(tipo)}
                          aria-label={`Editar ${tipo.nome}`}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTipo(tipo)}
                          aria-label={`Excluir ${tipo.nome}`}
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
              {filtered.length === 1 ? "tipo encontrado" : "tipos encontrados"}
              {search && ` para "${search}"`}
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TipoFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <TipoFormDialog
        open={!!editTipo}
        onOpenChange={(isOpen) => { if (!isOpen) setEditTipo(null); }}
        tipo={editTipo}
      />
      <DeleteTipoDialog
        open={!!deleteTipo}
        onOpenChange={(isOpen) => { if (!isOpen) setDeleteTipo(null); }}
        tipo={deleteTipo}
      />
    </div>
  );
}
