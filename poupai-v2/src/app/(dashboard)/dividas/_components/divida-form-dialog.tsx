"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { dividaSchema, type DividaFormData, type DividaRow } from "@/types/dividas";
import { createDividaAction, updateDividaAction } from "@/actions/dividas";

function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  divida?: DividaRow | null;
}

export function DividaFormDialog({ open, onOpenChange, divida }: Props) {
  const isEdit = !!divida;
  const [isPending, startTransition] = useTransition();

  const form = useForm<DividaFormData>({
    resolver: zodResolver(dividaSchema),
    defaultValues: {
      credor: "",
      descricao: "",
      valorTotal: 0,
      taxaJurosMensal: 0,
      nParcelas: 1,
      parcelasPagas: 0,
      dataInicio: new Date().toISOString().slice(0, 10),
      dataProxVencimento: "",
      categoria: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (divida) {
        form.reset({
          credor: divida.credor,
          descricao: divida.descricao ?? "",
          valorTotal: divida.valorTotal,
          taxaJurosMensal: divida.taxaJurosMensal,
          nParcelas: divida.nParcelas,
          parcelasPagas: divida.parcelasPagas,
          dataInicio: toInputDate(divida.dataInicio),
          dataProxVencimento: toInputDate(divida.dataProxVencimento),
          categoria: divida.categoria ?? "",
          observacoes: divida.observacoes ?? "",
        });
      } else {
        form.reset({
          credor: "",
          descricao: "",
          valorTotal: 0,
          taxaJurosMensal: 0,
          nParcelas: 1,
          parcelasPagas: 0,
          dataInicio: new Date().toISOString().slice(0, 10),
          dataProxVencimento: "",
          categoria: "",
          observacoes: "",
        });
      }
    }
  }, [open, divida, form]);

  function onSubmit(data: DividaFormData) {
    startTransition(async () => {
      const result = isEdit
        ? await updateDividaAction(divida!.id, data)
        : await createDividaAction(data);
      if (result.success) {
        toast.success(isEdit ? "Dívida atualizada." : "Dívida registrada.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const err = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar dívida" : "Nova dívida"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="credor">Credor *</Label>
              <Input id="credor" placeholder="Ex: Banco, loja, pessoa..." disabled={isPending} {...form.register("credor")} />
              {err.credor && <p className="text-xs text-destructive">{err.credor.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorTotal">Valor total *</Label>
              <Input id="valorTotal" type="number" step="0.01" min="0.01" disabled={isPending} {...form.register("valorTotal", { valueAsNumber: true })} />
              {err.valorTotal && <p className="text-xs text-destructive">{err.valorTotal.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxaJurosMensal">Juros mensal (%)</Label>
              <Input id="taxaJurosMensal" type="number" step="0.01" min="0" placeholder="0 = sem juros" disabled={isPending} {...form.register("taxaJurosMensal", { valueAsNumber: true })} />
              {err.taxaJurosMensal && <p className="text-xs text-destructive">{err.taxaJurosMensal.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nParcelas">Total de parcelas *</Label>
              <Input id="nParcelas" type="number" min="1" disabled={isPending} {...form.register("nParcelas", { valueAsNumber: true })} />
              {err.nParcelas && <p className="text-xs text-destructive">{err.nParcelas.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="parcelasPagas">Parcelas já pagas</Label>
              <Input id="parcelasPagas" type="number" min="0" disabled={isPending} {...form.register("parcelasPagas", { valueAsNumber: true })} />
              {err.parcelasPagas && <p className="text-xs text-destructive">{err.parcelasPagas.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataInicio">Data de início *</Label>
              <Input id="dataInicio" type="date" disabled={isPending} {...form.register("dataInicio")} />
              {err.dataInicio && <p className="text-xs text-destructive">{err.dataInicio.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataProxVencimento">Próximo vencimento</Label>
              <Input id="dataProxVencimento" type="date" disabled={isPending} {...form.register("dataProxVencimento")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="categoria">Categoria</Label>
              <Input id="categoria" placeholder="Ex: Empréstimo, financiamento..." disabled={isPending} {...form.register("categoria")} />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" placeholder="Observação rápida..." disabled={isPending} {...form.register("descricao")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="size-4 animate-spin" />{isEdit ? "Salvando..." : "Registrando..."}</>
              ) : isEdit ? (
                <><Save className="size-4" />Salvar</>
              ) : (
                <><Plus className="size-4" />Registrar</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
