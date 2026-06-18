"use client";
import { useState, useTransition } from "react";
import {
  Plus,
  Receipt,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DividaRow } from "@/types/dividas";
import { pagarParcelaAction, deleteDividaAction, batchDeleteDividaAction } from "@/actions/dividas";
import { Checkbox } from "@/components/ui/checkbox";
import { DividaFormDialog } from "./divida-form-dialog";
import { AmortizacaoDialog } from "./amortizacao-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  dividas: DividaRow[];
}

export function DividasClient({ dividas }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DividaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DividaRow | null>(null);
  const [amortizacaoTarget, setAmortizacaoTarget] = useState<DividaRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [isBatchPending, startBatchTransition] = useTransition();

  const ativas = dividas.filter((d) => !d.quitada);
  const quitadas = dividas.filter((d) => d.quitada);
  const totalDevedor = ativas.reduce((s, d) => s + d.saldoDevedor, 0);

  function openNew() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function openEdit(d: DividaRow) {
    setEditTarget(d);
    setFormOpen(true);
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleBatchDelete() {
    startBatchTransition(async () => {
      const result = await batchDeleteDividaAction([...selectedIds]);
      if (result.success) {
        const n = selectedIds.size;
        toast.success(`${n} dívida${n > 1 ? "s" : ""} excluída${n > 1 ? "s" : ""}.`);
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
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Receipt className="size-5 text-red-500" />
            Dívidas
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Carnês, empréstimos e parcelamentos
          </p>
        </div>
        <Button onClick={openNew} size="sm" className="shrink-0">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nova dívida</span>
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

      {/* Resumo */}
      {ativas.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-1.5 bg-red-500" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex size-6 items-center justify-center rounded-md bg-red-500/10">
                  <Receipt className="size-3.5 text-red-500" />
                </div>
                <p className="text-xs text-muted-foreground">Total devendo</p>
              </div>
              <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">
                {formatCurrency(totalDevedor)}
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-1.5 bg-amber-400" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex size-6 items-center justify-center rounded-md bg-amber-500/10">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                </div>
                <p className="text-xs text-muted-foreground">Dívidas ativas</p>
              </div>
              <p className="text-xl font-bold tabular-nums">{ativas.length}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card col-span-2 sm:col-span-1">
            <div className="h-1.5 bg-emerald-500" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </div>
                <p className="text-xs text-muted-foreground">Quitadas</p>
              </div>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {quitadas.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {dividas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <CheckCircle2 className="size-10 text-emerald-500/40" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma dívida registrada</p>
          <p className="text-xs text-muted-foreground">Registre carnês, empréstimos ou parcelamentos.</p>
          <Button onClick={openNew} variant="outline" size="sm" className="mt-1">
            <Plus className="size-4" />
            Registrar dívida
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ativas.map((d) => (
            <DividaCard
              key={d.id}
              divida={d}
              onEdit={() => openEdit(d)}
              onDelete={() => setDeleteTarget(d)}
              onSimular={() => setAmortizacaoTarget(d)}
              isSelected={selectedIds.has(d.id)}
              onToggle={() => toggleSelect(d.id)}
            />
          ))}
          {quitadas.length > 0 && (
            <>
              <p className="mt-2 text-xs font-medium text-muted-foreground">Quitadas</p>
              {quitadas.map((d) => (
                <DividaCard
                  key={d.id}
                  divida={d}
                  onEdit={() => openEdit(d)}
                  onDelete={() => setDeleteTarget(d)}
                  onSimular={() => setAmortizacaoTarget(d)}
                  isSelected={selectedIds.has(d.id)}
                  onToggle={() => toggleSelect(d.id)}
                />
              ))}
            </>
          )}
        </div>
      )}

      <DividaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        divida={editTarget}
      />

      <AmortizacaoDialog
        open={!!amortizacaoTarget}
        onOpenChange={(v) => { if (!v) setAmortizacaoTarget(null); }}
        divida={amortizacaoTarget}
      />

      <ExcluirDividaDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        divida={deleteTarget}
      />

      <Dialog open={batchDeleteOpen} onOpenChange={isBatchPending ? undefined : setBatchDeleteOpen}>
        <DialogContent showCloseButton={!isBatchPending}>
          <DialogHeader>
            <DialogTitle>Excluir dívidas selecionadas</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <span className="font-medium text-foreground">{selectedIds.size} dívida{selectedIds.size > 1 ? "s" : ""}</span>?
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

// ─── Card individual ─────────────────────────────────────────────────────────

function DividaCard({
  divida: d,
  onEdit,
  onDelete,
  onSimular,
  isSelected,
  onToggle,
}: {
  divida: DividaRow;
  onEdit: () => void;
  onDelete: () => void;
  onSimular: () => void;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const parcelas_restantes = d.nParcelas - d.parcelasPagas;

  const isVencida =
    !d.quitada &&
    d.dataProxVencimento &&
    new Date(d.dataProxVencimento) < new Date();

  function handlePagar() {
    startTransition(async () => {
      const result = await pagarParcelaAction(d.id);
      if (!result.success) toast.error(result.error);
      else toast.success("Parcela marcada como paga!");
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors",
        d.quitada && "opacity-60",
        isVencida && "border-red-300 dark:border-red-800/60",
        isSelected && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className="mt-1 shrink-0"
          aria-label={`Selecionar dívida ${d.credor}`}
        />
        {/* Ícone */}
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
            d.quitada ? "bg-emerald-500/10" : isVencida ? "bg-red-500/10" : "bg-foreground/6"
          )}
        >
          {d.quitada ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : isVencida ? (
            <AlertTriangle className="size-4 text-red-500" />
          ) : (
            <Receipt className="size-4 text-muted-foreground" />
          )}
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{d.credor}</span>
            {d.quitada && (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Quitada
              </span>
            )}
            {isVencida && (
              <span className="shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
                Vencida
              </span>
            )}
          </div>
          {d.descricao && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.descricao}</p>
          )}

          {/* Barra de progresso */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{d.parcelasPagas}/{d.nParcelas} parcelas</span>
              <span className="font-medium tabular-nums">{d.percentualPago.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  d.quitada ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(d.percentualPago, 100)}%` }}
              />
            </div>
          </div>

          {/* Valores */}
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              Parcela: <span className="font-semibold text-foreground tabular-nums">{formatCurrency(d.valorParcela)}</span>
            </span>
            <span>
              Saldo: <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(d.saldoDevedor)}</span>
            </span>
            {d.taxaJurosMensal > 0 && (
              <span>Juros: {d.taxaJurosMensal.toFixed(2)}%/mês</span>
            )}
            {d.dataProxVencimento && (
              <span>
                Vence: <span className={cn(isVencida && "text-red-600 dark:text-red-400 font-semibold")}>{formatDate(d.dataProxVencimento)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex shrink-0 items-center gap-1">
          {!d.quitada && parcelas_restantes > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePagar}
              disabled={isPending}
              className="h-7 px-2 text-xs"
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : <ChevronRight className="size-3" />}
              Pagar parcela
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSimular}
            aria-label="Simular amortização"
            title="Simular amortização"
          >
            <Calculator className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Editar">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Excluir"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Dialog excluir ───────────────────────────────────────────────────────────

function ExcluirDividaDialog({
  open,
  onOpenChange,
  divida,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  divida: DividaRow | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!divida) return;
    startTransition(async () => {
      const result = await deleteDividaAction(divida.id);
      if (result.success) {
        toast.success("Dívida removida.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Excluir dívida</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a dívida com{" "}
            <span className="font-medium text-foreground">{divida?.credor}</span>?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? <><Loader2 className="size-4 animate-spin" />Excluindo...</> : <><Trash2 className="size-4" />Excluir</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
