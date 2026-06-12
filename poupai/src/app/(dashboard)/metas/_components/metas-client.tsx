"use client";
import { useState } from "react";
import {
  Plus,
  Target,
  Pencil,
  Trash2,
  PiggyBank,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { MetaRow, MetaStatus } from "@/types/metas";
import { MetaFormDialog } from "./meta-form-dialog";
import { DeleteMetaDialog } from "./delete-meta-dialog";
import { AporteDialog } from "./aporte-dialog";

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

  const emAndamento = metas.filter((m) => m.status !== "concluida");
  const concluidas = metas.filter((m) => m.status === "concluida");
  const totalGuardado = metas.reduce((acc, m) => acc + m.totalAportado, 0);

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
    </div>
  );
}

function MetaGrid({
  metas,
  onEdit,
  onDelete,
  onAporte,
}: {
  metas: MetaRow[];
  onEdit: (m: MetaRow) => void;
  onDelete: (m: MetaRow) => void;
  onAporte: (m: MetaRow) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {metas.map((m) => {
        const cfg = statusConfig[m.status];
        const StatusIcon = cfg.icon;
        const pct = Math.min(m.percentual, 100);
        return (
          <div key={m.id} className="group flex flex-col rounded-xl border border-border bg-card p-5">
            {/* Título + ações */}
            <div className="flex items-start justify-between gap-2">
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
