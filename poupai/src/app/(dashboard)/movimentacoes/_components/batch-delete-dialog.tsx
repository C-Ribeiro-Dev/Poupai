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
import { batchDeleteMovimentacaoAction, batchHardDeleteMovimentacaoAction } from "@/actions/movimentacoes";

interface BatchDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: number[];
  onSuccess: () => void;
  isAdmin?: boolean;
}

export function BatchDeleteDialog({
  open,
  onOpenChange,
  ids,
  onSuccess,
  isAdmin,
}: BatchDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const count = ids.length;

  function handleSoftDelete() {
    startTransition(async () => {
      const result = await batchDeleteMovimentacaoAction(ids);
      if (result.success) {
        toast.success(`${count} movimentação${count > 1 ? "ções" : ""} excluída${count > 1 ? "s" : ""}.`);
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleHardDelete() {
    startTransition(async () => {
      const result = await batchHardDeleteMovimentacaoAction(ids);
      if (result.success) {
        toast.success(`${count} movimentação${count > 1 ? "ções" : ""} removida${count > 1 ? "s" : ""} permanentemente.`);
        onSuccess();
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
          <DialogTitle>Excluir movimentações</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">
              {count} movimentação{count > 1 ? "ções" : ""}
            </span>
            ? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={isAdmin ? "flex-col gap-2 sm:flex-row" : undefined}>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleHardDelete}
              disabled={isPending}
              className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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
                Excluir {count > 1 ? `${count} itens` : "1 item"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
