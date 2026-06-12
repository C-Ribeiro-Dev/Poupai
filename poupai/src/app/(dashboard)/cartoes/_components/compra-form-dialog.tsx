"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingCart } from "lucide-react";
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
import { compraCartaoSchema, type CompraCartaoFormData, type CartaoRow } from "@/types/cartoes";
import type { CategoriaRow } from "@/types/categorias";
import { CategoriaSelect } from "@/components/categoria-select";
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
    defaultValues: { descricao: "", categoria: "", responsavel: "", parcelas: 1, dataCompra: todayStr() },
  });

  const valorTotal = form.watch("valorTotal");
  const parcelas = form.watch("parcelas");

  useEffect(() => {
    if (open) {
      form.reset({
        descricao: "",
        categoria: "",
        responsavel: "",
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
    valorTotal > 0 && parcelas > 1 ? valorTotal / parcelas : null;

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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Mercado, Tênis, Passagem aérea"
              aria-invalid={!!form.formState.errors.descricao}
              disabled={isPending}
              {...form.register("descricao")}
            />
            {form.formState.errors.descricao && (
              <p className="text-xs text-destructive">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorTotal">Valor total (R$)</Label>
              <Input
                id="valorTotal"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                aria-invalid={!!form.formState.errors.valorTotal}
                disabled={isPending}
                {...form.register("valorTotal", { valueAsNumber: true })}
              />
              {form.formState.errors.valorTotal && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.valorTotal.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="parcelas">Parcelas</Label>
              <Input
                id="parcelas"
                type="number"
                min="1"
                max="48"
                aria-invalid={!!form.formState.errors.parcelas}
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
              {form.formState.errors.parcelas && (
                <p className="text-xs text-destructive">{form.formState.errors.parcelas.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataCompra">Data da compra</Label>
              <Input
                id="dataCompra"
                type="date"
                aria-invalid={!!form.formState.errors.dataCompra}
                disabled={isPending}
                {...form.register("dataCompra")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria">
                Categoria{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <CategoriaSelect
                id="categoria"
                categorias={categorias}
                isEntrada={false}
                currentValue={null}
                disabled={isPending}
                {...form.register("categoria")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="responsavel">
              Responsável pelo pagamento{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="responsavel"
              placeholder="Ex: João, Maria — deixe vazio se for você"
              disabled={isPending}
              {...form.register("responsavel")}
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
