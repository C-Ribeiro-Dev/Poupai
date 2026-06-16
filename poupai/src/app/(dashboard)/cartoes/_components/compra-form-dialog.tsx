"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingCart, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
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
import { compraCartaoSchema, type CompraCartaoFormData, type CartaoRow } from "@/types/cartoes";
import type { CategoriaRow } from "@/types/categorias";
import { createCompraCartaoAction } from "@/actions/cartoes";

const todayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

interface CompraFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: CartaoRow | null;
  categorias: CategoriaRow[];
}

export function CompraFormDialog({ open, onOpenChange, cartao, categorias }: CompraFormDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CompraCartaoFormData>({
    resolver: zodResolver(compraCartaoSchema),
    defaultValues: { descricao: "", categoria: "", responsavel: "", recorrente: false, parcelas: 1, dataCompra: todayStr() },
  });

  const valorTotal = form.watch("valorTotal");
  const parcelas = form.watch("parcelas");
  const recorrente = form.watch("recorrente");

  useEffect(() => {
    if (open) {
      form.reset({
        descricao: "",
        categoria: "",
        responsavel: "",
        recorrente: false,
        valorTotal: undefined as unknown as number,
        parcelas: 1,
        dataCompra: todayStr(),
      });
    }
  }, [open, form]);

  function onSubmit(data: CompraCartaoFormData) {
    if (!cartao) return;
    startTransition(async () => {
      const result = await createCompraCartaoAction(cartao.id, data);
      if (result.success) {
        toast.success("Compra lançada com sucesso.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const valorParcelaPreview =
    !recorrente && valorTotal > 0 && parcelas > 1 ? valorTotal / parcelas : null;

  const categoriasSaida = categorias.filter(
    (c) => c.ativo && (c.tipo === "saida" || c.tipo === "ambos")
  );

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" style={{ color: cartao?.cor }} />
            Nova compra em {cartao?.nome}
          </DialogTitle>
          <DialogDescription>
            Compras até o dia {cartao?.diaFechamento} entram na fatura do mês; depois, na do mês
            seguinte.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Tipo: compra única ou recorrente */}
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-input">
            <button
              type="button"
              disabled={isPending}
              onClick={() => form.setValue("recorrente", false)}
              className={cn(
                "py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                !recorrente
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Compra única
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => form.setValue("recorrente", true)}
              className={cn(
                "flex items-center justify-center gap-1.5 border-l border-input py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                recorrente
                  ? "bg-violet-500/15 text-violet-700 dark:text-violet-400"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <RefreshCw className="size-3.5" />
              Assinatura / Recorrente
            </button>
          </div>

          <FloatingInput
            label="Descrição"
            id="descricao"
            placeholder="Ex: Netflix, Mercado, Tênis"
            aria-invalid={!!form.formState.errors.descricao}
            error={form.formState.errors.descricao?.message}
            disabled={isPending}
            {...form.register("descricao")}
          />

          <div className={cn("grid gap-3", recorrente ? "grid-cols-1" : "grid-cols-2")}>
            <FloatingInput
              label={recorrente ? "Valor mensal (R$)" : "Valor total (R$)"}
              id="valorTotal"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              aria-invalid={!!form.formState.errors.valorTotal}
              error={form.formState.errors.valorTotal?.message}
              disabled={isPending}
              {...form.register("valorTotal", { valueAsNumber: true })}
            />
            {!recorrente && (
              <div className="flex flex-col gap-1.5">
                <FloatingInput
                  label="Parcelas"
                  id="parcelas"
                  type="number"
                  min="1"
                  max="48"
                  aria-invalid={!!form.formState.errors.parcelas}
                  error={form.formState.errors.parcelas?.message}
                  disabled={isPending}
                  {...form.register("parcelas", {
                    setValueAs: (v: unknown) => {
                      const n = parseInt(String(v), 10);
                      return isNaN(n) ? 1 : n;
                    },
                  })}
                />
                {valorParcelaPreview && (
                  <p className="text-xs text-muted-foreground">
                    {parcelas}x de {formatCurrency(valorParcelaPreview)}
                  </p>
                )}
              </div>
            )}
          </div>

          {recorrente && (
            <p className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-700 dark:text-violet-400">
              Essa cobrança aparecerá automaticamente em todas as faturas a partir deste mês. Para cancelar, exclua a compra.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Data da compra"
              id="dataCompra"
              type="date"
              aria-invalid={!!form.formState.errors.dataCompra}
              disabled={isPending}
              {...form.register("dataCompra")}
            />
            <FloatingCombobox
              label="Categoria (opcional)"
              options={categoriasSaida.map((c) => ({ value: c.nome, label: c.nome }))}
              value={form.watch("categoria") ?? ""}
              onChange={(v) => form.setValue("categoria", v, { shouldValidate: true })}
              disabled={isPending}
              error={form.formState.errors.categoria?.message}
            />
          </div>

          <FloatingInput
            label="Responsável pelo pagamento (opcional)"
            id="responsavel"
            placeholder="Ex: João, Maria — deixe vazio se for você"
            disabled={isPending}
            {...form.register("responsavel")}
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
                  Lançando...
                </>
              ) : (
                "Lançar compra"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
