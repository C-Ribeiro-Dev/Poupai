"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2, ArrowUpRight, ArrowDownRight, Coins } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  lancamentoSchema,
  TIPOS_LANCAMENTO,
  type LancamentoFormData,
  type AtivoRow,
} from "@/types/investimentos";
import { createLancamentoAction, deleteLancamentoAction } from "@/actions/investimentos";

const todayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const tipoIcon: Record<string, { icon: React.ElementType; cls: string }> = {
  aporte: { icon: ArrowUpRight, cls: "bg-emerald-500/10 text-emerald-500" },
  resgate: { icon: ArrowDownRight, cls: "bg-red-500/10 text-red-500" },
  provento: { icon: Coins, cls: "bg-amber-500/10 text-amber-500" },
};

const tipoLabel: Record<string, string> = {
  aporte: "Aporte",
  resgate: "Resgate",
  provento: "Provento",
};

interface LancamentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo: AtivoRow | null;
}

export function LancamentosDialog({ open, onOpenChange, ativo }: LancamentosDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LancamentoFormData>({
    resolver: zodResolver(lancamentoSchema),
    defaultValues: { tipo: "aporte", data: todayStr(), observacao: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: "aporte",
        valor: undefined as unknown as number,
        data: todayStr(),
        observacao: "",
      });
    }
  }, [open, form]);

  function onSubmit(data: LancamentoFormData) {
    if (!ativo) return;
    startTransition(async () => {
      const result = await createLancamentoAction(ativo.id, data);
      if (result.success) {
        toast.success("Lançamento registrado com sucesso.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const result = await deleteLancamentoAction(id);
      if (result.success) {
        toast.success("Lançamento excluído.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!ativo) return null;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Movimentações — {ativo.nome}</DialogTitle>
        </DialogHeader>

        {/* Novo lançamento */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3.5"
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo" className="text-xs">
                Tipo
              </Label>
              <select
                id="tipo"
                disabled={isPending}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                {...form.register("tipo")}
              >
                {TIPOS_LANCAMENTO.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valor" className="text-xs">
                Valor (R$)
              </Label>
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data" className="text-xs">
                Data
              </Label>
              <Input id="data" type="date" disabled={isPending} {...form.register("data")} />
            </div>
          </div>
          {form.formState.errors.valor && (
            <p className="text-xs text-destructive">{form.formState.errors.valor.message}</p>
          )}
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Registrar lançamento"
            )}
          </Button>
        </form>

        {/* Histórico */}
        {ativo.lancamentos.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhum lançamento ainda.
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            <div className="divide-y divide-border">
              {ativo.lancamentos.map((l) => {
                const cfg = tipoIcon[l.tipo];
                const Icon = cfg.icon;
                return (
                  <div key={l.id} className="group flex items-center gap-3 px-3.5 py-2.5">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md",
                        cfg.cls
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{tipoLabel[l.tipo]}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {l.observacao ? `${l.observacao} · ` : ""}
                        {formatDate(l.data)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {l.tipo === "resgate" ? "−" : "+"}
                      {formatCurrency(l.valor)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDelete(l.id)}
                      aria-label="Excluir lançamento"
                      className="text-destructive transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
