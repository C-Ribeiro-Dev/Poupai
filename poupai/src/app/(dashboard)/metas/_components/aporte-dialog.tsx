"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aporteSchema, type AporteFormData, type MetaRow } from "@/types/metas";
import { aportarMetaAction } from "@/actions/metas";

const todayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

interface AporteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: MetaRow | null;
}

export function AporteDialog({ open, onOpenChange, meta }: AporteDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<AporteFormData>({
    resolver: zodResolver(aporteSchema),
    defaultValues: { data: todayStr() },
  });

  useEffect(() => {
    if (open) {
      form.reset({ valor: undefined as unknown as number, data: todayStr() });
    }
  }, [open, form]);

  function onSubmit(data: AporteFormData) {
    if (!meta) return;
    startTransition(async () => {
      const result = await aportarMetaAction(meta.id, data);
      if (result.success) {
        toast.success("Aporte registrado com sucesso.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="size-5" style={{ color: meta?.cor }} />
            Aporte em {meta?.nome}
          </DialogTitle>
          <DialogDescription>
            {meta && (
              <>
                Faltam{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(meta.restante)}
                </span>{" "}
                para atingir a meta.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                autoFocus
                aria-invalid={!!form.formState.errors.valor}
                disabled={isPending}
                {...form.register("valor", { valueAsNumber: true })}
              />
              {form.formState.errors.valor && (
                <p className="text-xs text-destructive">{form.formState.errors.valor.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                aria-invalid={!!form.formState.errors.data}
                disabled={isPending}
                {...form.register("data")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar aporte"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
