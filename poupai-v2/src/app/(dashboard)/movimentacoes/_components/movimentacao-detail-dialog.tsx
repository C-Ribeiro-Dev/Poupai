"use client";
import { Repeat2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MovimentacaoRow } from "@/types/movimentacoes";

interface MovimentacaoDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoRow | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

export function MovimentacaoDetailDialog({
  open,
  onOpenChange,
  movimentacao,
}: MovimentacaoDetailDialogProps) {
  if (!movimentacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da movimentação</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Value — prominent */}
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  movimentacao.isEntrada
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                )}
              >
                {movimentacao.isEntrada ? "+" : "-"}
                {formatCurrency(movimentacao.valor)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                movimentacao.isEntrada
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/15 text-red-700 dark:text-red-400"
              )}
            >
              {movimentacao.isEntrada ? "Entrada" : "Saída"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Tipo">
              {movimentacao.tipoNome}
            </DetailRow>
            <DetailRow label="Data">
              {formatDate(movimentacao.data)}
            </DetailRow>
            {movimentacao.categoria && (
              <DetailRow label="Categoria">
                {movimentacao.categoria}
              </DetailRow>
            )}
            {movimentacao.isFixaOuDiaria && (
              <DetailRow label="Recorrência">
                <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                  <Repeat2 className="size-4" />
                  Movimentação fixa
                </span>
              </DetailRow>
            )}
          </div>

          {movimentacao.descricao && (
            <DetailRow label="Descrição">
              <span className="font-normal text-muted-foreground">
                {movimentacao.descricao}
              </span>
            </DetailRow>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
