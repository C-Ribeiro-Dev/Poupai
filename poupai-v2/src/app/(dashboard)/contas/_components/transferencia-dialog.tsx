"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
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
import {
  transferenciaSchema,
  type TransferenciaFormData,
  type ContaRow,
} from "@/types/contas";
import { transferirAction } from "@/actions/contas";

const todayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

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
        valor: undefined as unknown as number,
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

  const selectClass =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deContaId">De</Label>
              <select
                id="deContaId"
                disabled={isPending}
                aria-invalid={!!form.formState.errors.deContaId}
                className={selectClass}
                {...form.register("deContaId", { valueAsNumber: true })}
              >
                <option value={0}>Conta de origem...</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {form.formState.errors.deContaId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.deContaId.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paraContaId">Para</Label>
              <select
                id="paraContaId"
                disabled={isPending}
                aria-invalid={!!form.formState.errors.paraContaId}
                className={selectClass}
                {...form.register("paraContaId", { valueAsNumber: true })}
              >
                <option value={0}>Conta de destino...</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {form.formState.errors.paraContaId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.paraContaId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
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
              <Input id="data" type="date" disabled={isPending} {...form.register("data")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">
              Descrição{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="descricao"
              placeholder="Ex: Reserva do mês"
              disabled={isPending}
              {...form.register("descricao")}
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
