"use client";
import { useMemo, useState } from "react";
import { Plus, Search, Shapes, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoriaRow } from "@/types/categorias";
import { getCategoriaIcon } from "@/lib/categorias-config";
import { CategoriaFormDialog } from "./categoria-form-dialog";
import { DeleteCategoriaDialog } from "./delete-categoria-dialog";

type Filtro = "todos" | "entrada" | "saida" | "ambos";

const filtros: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todas" },
  { key: "entrada", label: "Entradas" },
  { key: "saida", label: "Saídas" },
  { key: "ambos", label: "Ambos" },
];

const tipoLabel: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ambos: "Ambos",
};

const tipoBadge: Record<string, string> = {
  entrada: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  saida: "bg-red-500/15 text-red-700 dark:text-red-400",
  ambos: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
};

type StatusFiltro = "todas" | "ativas" | "inativas";

interface CategoriasClientProps {
  categorias: CategoriaRow[];
  initialSearch?: string;
}

export function CategoriasClient({ categorias, initialSearch }: CategoriasClientProps) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todas");
  const [search, setSearch] = useState(initialSearch ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<CategoriaRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<CategoriaRow | null>(null);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return categorias.filter((c) => {
      if (filtro !== "todos" && c.tipo !== filtro) return false;
      if (statusFiltro === "ativas" && !c.ativo) return false;
      if (statusFiltro === "inativas" && c.ativo) return false;
      if (term && !c.nome.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [categorias, filtro, statusFiltro, search]);

  const ativas = filtered.filter((c) => c.ativo);
  const inativas = filtered.filter((c) => !c.ativo);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Categorias</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {categorias.length} categoria{categorias.length !== 1 ? "s" : ""} cadastrada{categorias.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova categoria</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {filtros.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filtro === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as StatusFiltro)}
            aria-label="Filtrar por status"
            className="h-8 shrink-0 rounded-lg border border-input bg-transparent px-2.5 text-xs text-muted-foreground outline-none transition-colors focus:border-ring focus:text-foreground dark:bg-input/30"
          >
            <option value="todas">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <Shapes className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            Criar categoria
          </Button>
        </div>
      )}

      {/* Grid de categorias ativas */}
      {ativas.length > 0 && (
        <div>
          {inativas.length > 0 && (
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ativas
            </p>
          )}
          <CategoriaGrid
            categorias={ativas}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
          />
        </div>
      )}

      {/* Grid de categorias inativas */}
      {inativas.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inativas
          </p>
          <CategoriaGrid
            categorias={inativas}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
          />
        </div>
      )}

      <CategoriaFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <CategoriaFormDialog
        open={!!editItem}
        onOpenChange={(isOpen) => { if (!isOpen) setEditItem(null); }}
        categoria={editItem}
      />
      <DeleteCategoriaDialog
        open={!!deleteItem}
        onOpenChange={(isOpen) => { if (!isOpen) setDeleteItem(null); }}
        categoria={deleteItem}
      />
    </div>
  );
}

function CategoriaGrid({
  categorias,
  onEdit,
  onDelete,
}: {
  categorias: CategoriaRow[];
  onEdit: (c: CategoriaRow) => void;
  onDelete: (c: CategoriaRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categorias.map((cat) => {
        const Icon = getCategoriaIcon(cat.icone);
        return (
          <div
            key={cat.id}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80",
              !cat.ativo && "opacity-60"
            )}
          >
            {/* Ícone colorido */}
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${cat.cor}22` }}
            >
              <Icon className="size-5" style={{ color: cat.cor }} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{cat.nome}</p>
              <span
                className={cn(
                  "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium",
                  tipoBadge[cat.tipo]
                )}
              >
                {tipoLabel[cat.tipo]}
              </span>
            </div>

            {/* Actions (visible on hover) */}
            <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
              <button
                onClick={() => onEdit(cat)}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Editar"
              >
                <Pencil className="size-3.5" />
              </button>
              {!cat.isDefault && (
                <button
                  onClick={() => onDelete(cat)}
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                  aria-label="Excluir"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
