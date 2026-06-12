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
import type { OrcamentoRow } from "@/types/orcamentos";
import { deleteOrcamentoAction } from "@/actions/orcamentos";

interface DeleteOrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: OrcamentoRow | null;
}

export function DeleteOrcamentoDialog({
  open,
  onOpenChange,
  orcamento,
}: DeleteOrcamentoDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!orcamento) return;
    startTransition(async () => {
      const result = await deleteOrcamentoAction(orcamento.id);
      if (result.success) {
        toast.success("Orçamento excluído com sucesso.");
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
          <DialogTitle>Excluir orçamento</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o orçamento de{" "}
            <span className="font-medium text-foreground">{orcamento?.categoria}</span>? As
            movimentações da categoria não serão afetadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
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
