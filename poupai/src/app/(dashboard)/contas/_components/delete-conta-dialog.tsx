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
import type { ContaRow } from "@/types/contas";
import { deleteContaAction } from "@/actions/contas";

interface DeleteContaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaRow | null;
}

export function DeleteContaDialog({ open, onOpenChange, conta }: DeleteContaDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!conta) return;
    startTransition(async () => {
      const result = await deleteContaAction(conta.id);
      if (result.success) {
        toast.success("Conta excluída com sucesso.");
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
          <DialogTitle>Excluir conta</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{conta?.nome}</span>? Movimentações
            já vinculadas a esta conta não serão apagadas.
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
