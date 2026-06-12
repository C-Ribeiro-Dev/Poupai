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
import { deleteTipoAction } from "@/actions/tipos";
import type { TipoMovimentacaoRow } from "@/types/tipos";

interface DeleteTipoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TipoMovimentacaoRow | null;
}

export function DeleteTipoDialog({ open, onOpenChange, tipo }: DeleteTipoDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!tipo) return;
    startTransition(async () => {
      const result = await deleteTipoAction(tipo.id);
      if (result.success) {
        toast.success("Tipo excluído com sucesso.");
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
          <DialogTitle>Excluir tipo de movimentação</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{tipo?.nome}</span>?
            Esta ação não pode ser desfeita.
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
