"use client";
import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteMovimentacaoAction, hardDeleteMovimentacaoAction } from "@/actions/movimentacoes";
import type { MovimentacaoRow } from "@/types/movimentacoes";

interface DeleteMovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao: MovimentacaoRow | null;
  isAdmin?: boolean;
}

export function DeleteMovimentacaoDialog({
  open,
  onOpenChange,
  movimentacao,
  isAdmin,
}: DeleteMovimentacaoDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleSoftDelete() {
    if (!movimentacao) return;
    startTransition(async () => {
      const result = await deleteMovimentacaoAction(movimentacao.id);
      if (result.success) {
        toast.success("Movimentação excluída com sucesso.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleHardDelete() {
    if (!movimentacao) return;
    startTransition(async () => {
      const result = await hardDeleteMovimentacaoAction(movimentacao.id);
      if (result.success) {
        toast.success("Movimentação removida permanentemente.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Excluir movimentação</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a movimentação{" "}
            {movimentacao && (
              <span className="font-medium text-foreground">
                {movimentacao.tipoNome} —{" "}
                {formatCurrency(movimentacao.valor)}
              </span>
            )}
            ? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={isAdmin ? "flex-col gap-2 sm:flex-row" : undefined}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={handleHardDelete} disabled={isPending}
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Excluir permanentemente
            </Button>
          )}
          <Button variant="destructive" onClick={handleSoftDelete} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Excluir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
