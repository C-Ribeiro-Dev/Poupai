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
import type { CategoriaRow } from "@/types/categorias";
import { deleteCategoriaAction } from "@/actions/categorias";

interface DeleteCategoriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaRow | null;
}

export function DeleteCategoriaDialog({
  open,
  onOpenChange,
  categoria,
}: DeleteCategoriaDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!categoria) return;
    startTransition(async () => {
      const result = await deleteCategoriaAction(categoria.id);
      if (result.success) {
        toast.success("Categoria excluída com sucesso.");
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
          <DialogTitle>Excluir categoria</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">{categoria?.nome}</span>? Esta ação
            não pode ser desfeita. Movimentações já registradas com esta categoria não serão
            afetadas.
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
