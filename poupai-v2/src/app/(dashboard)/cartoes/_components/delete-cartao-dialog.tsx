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
import type { CartaoRow } from "@/types/cartoes";
import { deleteCartaoAction } from "@/actions/cartoes";

interface DeleteCartaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: CartaoRow | null;
}

export function DeleteCartaoDialog({ open, onOpenChange, cartao }: DeleteCartaoDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!cartao) return;
    startTransition(async () => {
      const result = await deleteCartaoAction(cartao.id);
      if (result.success) {
        toast.success("Cartão excluído com sucesso.");
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
          <DialogTitle>Excluir cartão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{cartao?.nome}</span>? As compras e
            faturas deixarão de ser exibidas. Esta ação não pode ser desfeita.
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
