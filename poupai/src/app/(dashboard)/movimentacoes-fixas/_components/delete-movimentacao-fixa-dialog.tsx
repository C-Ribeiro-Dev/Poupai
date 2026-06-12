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
import { deleteMovimentacaoFixaAction } from "@/actions/movimentacoes-fixas";
import type { MovimentacaoFixaRow } from "@/types/movimentacoes-fixas";

interface DeleteMovimentacaoFixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacaoFixa: MovimentacaoFixaRow | null;
}

export function DeleteMovimentacaoFixaDialog({
  open,
  onOpenChange,
  movimentacaoFixa,
}: DeleteMovimentacaoFixaDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!movimentacaoFixa) return;
    startTransition(async () => {
      const result = await deleteMovimentacaoFixaAction(movimentacaoFixa.id);
      if (result.success) {
        toast.success("Movimentação fixa excluída com sucesso.");
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
          <DialogTitle>Excluir movimentação fixa</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            {movimentacaoFixa && (
              <span className="font-medium text-foreground">
                {movimentacaoFixa.nome} — {formatCurrency(movimentacaoFixa.valor)}
              </span>
            )}
            ? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
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
