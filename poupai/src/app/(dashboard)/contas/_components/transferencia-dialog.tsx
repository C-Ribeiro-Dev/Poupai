"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  transferenciaSchema,
  type TransferenciaFormData,
  type ContaRow,
} from "@/types/contas";
import { todayStr } from "@/lib/utils";
import { transferirAction } from "@/actions/contas";

interface TransferenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: ContaRow[];
}

export function TransferenciaDialog({ open, onOpenChange, contas }: TransferenciaDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TransferenciaFormData>({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: { deContaId: 0, paraContaId: 0, data: todayStr(), descricao: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        deContaId: 0,
        paraContaId: 0,
        valor: NaN,
        data: todayStr(),
        descricao: "",
      });
    }
  }, [open, form]);

  function onSubmit(data: TransferenciaFormData) {
    startTransition(async () => {
      const result = await transferirAction(data);
      if (result.success) {
        toast.success("Transferência registrada com sucesso.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-blue-500" />
            Transferência entre contas
          </DialogTitle>
          <DialogDescription>
            Transferências movem saldo entre contas e não contam como receita ou despesa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FloatingCombobox
              label="De"
              options={contas.map((c) => ({ value: String(c.id), label: c.nome }))}
              value={form.watch("deContaId") ? String(form.watch("deContaId")) : ""}
              onChange={(v) => form.setValue("deContaId", v ? Number(v) : 0, { shouldValidate: true })}
              disabled={isPending}
              error={form.formState.errors.deContaId?.message}
            />
            <FloatingCombobox
              label="Para"
              options={contas.map((c) => ({ value: String(c.id), label: c.nome }))}
              value={form.watch("paraContaId") ? String(form.watch("paraContaId")) : ""}
              onChange={(v) => form.setValue("paraContaId", v ? Number(v) : 0, { shouldValidate: true })}
              disabled={isPending}
              error={form.formState.errors.paraContaId?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Valor (R$)"
              id="valor"
              type="number"
              step="0.01"
              min="0.01"
              aria-invalid={!!form.formState.errors.valor}
              error={form.formState.errors.valor?.message}
              disabled={isPending}
              {...form.register("valor", { valueAsNumber: true })}
            />
            <FloatingInput
              label="Data"
              id="data"
              type="date"
              disabled={isPending}
              {...form.register("data")}
            />
          </div>

          <FloatingInput
            label="Descrição (opcional)"
            id="descricao"
            disabled={isPending}
            {...form.register("descricao")}
          />

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
                  Transferindo...
                </>
              ) : (
                "Transferir"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
