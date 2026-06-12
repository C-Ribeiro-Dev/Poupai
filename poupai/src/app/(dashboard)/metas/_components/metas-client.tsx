"use client";
import { useState, useTransition } from "react";
import {
  Plus,
  Target,
  Pencil,
  Trash2,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { MetaRow, MetaStatus } from "@/types/metas";
import { batchDeleteMetaAction } from "@/actions/metas";
import { MetaFormDialog } from "./meta-form-dialog";
import { DeleteMetaDialog } from "./delete-meta-dialog";
import { AporteDialog } from "./aporte-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig: Record<MetaStatus, { label: string; icon: React.ElementType; badge: string }> = {
  concluida: {
    label: "Concluída",
    icon: CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  atrasada: {
    label: "Atrasada",
    icon: AlertCircle,
    badge: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  no_prazo: {
    label: "No prazo",
    icon: CalendarClock,
    badge: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  sem_prazo: {
    label: "Sem prazo",
    icon: Target,
    badge: "bg-foreground/8 text-muted-foreground",
  },
};

const formatDataAlvo = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(d));

interface MetasClientProps {
  metas: MetaRow[];
}

export function MetasClient({ metas }: MetasClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<MetaRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<MetaRow | null>(null);
  const [aporteItem, setAporteItem] = useState<MetaRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [isBatchPending, startBatchTransition] = useTransition();

  const emAndamento = metas.filter((m) => m.status !== "concluida");
  const concluidas = metas.filter((m) => m.status === "concluida");
  const totalGuardado = metas.reduce((acc, m) => acc + m.totalAportado, 0);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleBatchDelete() {
    startBatchTransition(async () => {
      const result = await batchDeleteMetaAction([...selectedIds]);
      if (result.success) {
        const n = selectedIds.size;
        toast.success(`${n} meta${n > 1 ? "s" : ""} excluída${n > 1 ? "s" : ""}.`);
        setSelectedIds(new Set());
        setBatchDeleteOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Metas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {metas.length > 0
              ? `${formatCurrency(totalGuardado)} guardados em ${metas.length} meta${metas.length !== 1 ? "s" : ""}`
              : "Defina objetivos e acompanhe seu progresso"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova meta</span>
          <span className="sm:hidden">Nova</span>
        </Button>
      </div>

      {/* Batch action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
          <span className="text-sm font-medium">
            {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
            Limpar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setBatchDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Excluir selecionadas
          </Button>
        </div>
      )}

      {/* Progresso geral */}
      {metas.length > 0 && (() => {
        const totalAlvo = metas.filter((m) => m.status !== "concluida").reduce((acc, m) => acc + m.valorAlvo, 0);
        const totalAportadoAtivas = metas.filter((m) => m.status !== "concluida").reduce((acc, m) => acc + m.totalAportado, 0);
        const pctGeral = totalAlvo > 0 ? (totalAportadoAtivas / totalAlvo) * 100 : 0;
        if (emAndamento.length === 0) return null;
        return (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Progresso geral</p>
                <p className="mt-0.5 font-semibold tabular-nums">
                  {formatCurrency(totalAportadoAtivas)}
                  <span className="text-xs font-normal text-muted-foreground"> / {formatCurrency(totalAlvo)}</span>
                </p>
              </div>
              <span className="text-2xl font-bold tabular-nums text-primary">{pctGeral.toFixed(0)}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(pctGeral, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>{emAndamento.length} em andamento</span>
              {concluidas.length > 0 && <span>{concluidas.length} concluída{concluidas.length !== 1 ? "s" : ""}</span>}
            </div>
          </div>
        );
      })()}

      {/* Empty state */}
      {metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Target className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium">Nenhuma meta criada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie objetivos como &quot;Reserva de emergência&quot; ou &quot;Viagem&quot; e
              registre aportes para acompanhar o progresso.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
            <Plus className="size-4" />
            Criar primeira meta
          </Button>
        </div>
      ) : (
        <>
          {emAndamento.length > 0 && (
            <MetaGrid
              metas={emAndamento}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
              onAporte={setAporteItem}
              selectedIds={selectedIds}
              onToggle={toggleSelect}
            />
          )}
          {concluidas.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Concluídas 🎉
              </p>
              <MetaGrid
                metas={concluidas}
                onEdit={setEditItem}
                onDelete={setDeleteItem}
                onAporte={setAporteItem}
                selectedIds={selectedIds}
                onToggle={toggleSelect}
              />
            </div>
          )}
        </>
      )}

      <MetaFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <MetaFormDialog
        open={!!editItem}
        onOpenChange={(o) => {
          if (!o) setEditItem(null);
        }}
        meta={editItem}
      />
      <DeleteMetaDialog
        open={!!deleteItem}
        onOpenChange={(o) => {
          if (!o) setDeleteItem(null);
        }}
        meta={deleteItem}
      />
      <AporteDialog
        open={!!aporteItem}
        onOpenChange={(o) => {
          if (!o) setAporteItem(null);
        }}
        meta={aporteItem}
      />

      <Dialog open={batchDeleteOpen} onOpenChange={isBatchPending ? undefined : setBatchDeleteOpen}>
        <DialogContent showCloseButton={!isBatchPending}>
          <DialogHeader>
            <DialogTitle>Excluir metas selecionadas</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">{selectedIds.size} meta{selectedIds.size > 1 ? "s" : ""}</span>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDeleteOpen(false)} disabled={isBatchPending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete} disabled={isBatchPending}>
              {isBatchPending ? <><Loader2 className="size-4 animate-spin" />Excluindo...</> : <><Trash2 className="size-4" />Excluir</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaGrid({
  metas,
  onEdit,
  onDelete,
  onAporte,
  selectedIds,
  onToggle,
}: {
  metas: MetaRow[];
  onEdit: (m: MetaRow) => void;
  onDelete: (m: MetaRow) => void;
  onAporte: (m: MetaRow) => void;
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metas.map((m) => {
        const cfg = statusConfig[m.status];
        const StatusIcon = cfg.icon;
        const pct = Math.min(m.percentual, 100);
        const isSelected = selectedIds.has(m.id);
        return (
          <div key={m.id} className={cn("group flex flex-col rounded-xl border border-border bg-card p-5", isSelected && "ring-2 ring-primary/40")}>
            {/* Título + ações */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(m.id)}
                  className="mt-0.5 shrink-0"
                  aria-label={`Selecionar meta ${m.nome}`}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.nome}</p>
                  <span
                    className={cn(
                      "mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                      cfg.badge
                    )}
                  >
                    <StatusIcon className="size-3" />
                    {cfg.label}
                    {m.dataAlvo && m.status !== "concluida" && ` · ${formatDataAlvo(m.dataAlvo)}`}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onEdit(m)}
                  aria-label={`Editar meta ${m.nome}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(m)}
                  aria-label={`Excluir meta ${m.nome}`}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            {m.descricao && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.descricao}</p>
            )}

            {/* Progresso */}
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: m.cor }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(m.totalAportado)}{" "}
                <span className="text-muted-foreground/60">/ {formatCurrency(m.valorAlvo)}</span>
              </span>
              <span className="font-semibold tabular-nums" style={{ color: m.cor }}>
                {m.percentual.toFixed(0)}%
              </span>
            </div>

            {/* Sugestão de aporte */}
            {m.status === "no_prazo" && m.aporteSugerido !== null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Guarde{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(m.aporteSugerido)}/mês
                </span>{" "}
                para concluir em {m.mesesRestantes} {m.mesesRestantes === 1 ? "mês" : "meses"}.
              </p>
            )}
            {m.status === "atrasada" && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Prazo vencido — faltam {formatCurrency(m.restante)}.
              </p>
            )}

            {/* Aportar */}
            {m.status !== "concluida" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => onAporte(m)}
              >
                <PiggyBank className="size-4" />
                Registrar aporte
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
