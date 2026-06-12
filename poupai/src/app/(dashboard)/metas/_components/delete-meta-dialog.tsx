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
import type { MetaRow } from "@/types/metas";
import { deleteMetaAction } from "@/actions/metas";

interface DeleteMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: MetaRow | null;
}

export function DeleteMetaDialog({ open, onOpenChange, meta }: DeleteMetaDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!meta) return;
    startTransition(async () => {
      const result = await deleteMetaAction(meta.id);
      if (result.success) {
        toast.success("Meta excluída com sucesso.");
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
          <DialogTitle>Excluir meta</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{meta?.nome}</span>? O histórico de
            aportes também deixará de ser exibido.
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
