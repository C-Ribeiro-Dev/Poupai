"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { todayStr } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
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
      form.reset({ valor: NaN, data: todayStr() });
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
            <FloatingInput
              label="Valor (R$)"
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              aria-invalid={!!form.formState.errors.valor}
              error={form.formState.errors.valor?.message}
              disabled={isPending}
              {...form.register("valor", { valueAsNumber: true })}
            />
            <FloatingInput
              label="Data"
              id="data"
              type="date"
              aria-invalid={!!form.formState.errors.data}
              disabled={isPending}
              {...form.register("data")}
            />
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
