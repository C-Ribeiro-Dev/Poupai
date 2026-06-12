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
import type { AtivoRow } from "@/types/investimentos";
import { deleteAtivoAction } from "@/actions/investimentos";

interface DeleteAtivoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo: AtivoRow | null;
}

export function DeleteAtivoDialog({ open, onOpenChange, ativo }: DeleteAtivoDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!ativo) return;
    startTransition(async () => {
      const result = await deleteAtivoAction(ativo.id);
      if (result.success) {
        toast.success("Ativo excluído com sucesso.");
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
          <DialogTitle>Excluir ativo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{ativo?.nome}</span>? O histórico de
            aportes e proventos deixará de ser exibido.
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
