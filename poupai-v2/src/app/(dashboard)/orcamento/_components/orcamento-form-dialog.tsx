"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { orcamentoSchema, type OrcamentoFormData, type OrcamentoRow } from "@/types/orcamentos";
import type { CategoriaRow } from "@/types/categorias";
import { createOrcamentoAction, updateOrcamentoAction } from "@/actions/orcamentos";

interface OrcamentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento?: OrcamentoRow | null;
  categoriasDisponiveis: CategoriaRow[];
}

export function OrcamentoFormDialog({
  open,
  onOpenChange,
  orcamento,
  categoriasDisponiveis,
}: OrcamentoFormDialogProps) {
  const isEditing = !!orcamento;
  const [isPending, startTransition] = useTransition();

  const form = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: { categoria: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoria: orcamento?.categoria ?? "",
        valor: orcamento?.valor ?? (undefined as unknown as number),
      });
    }
  }, [open, orcamento, form]);

  function onSubmit(data: OrcamentoFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateOrcamentoAction(orcamento.id, data)
        : await createOrcamentoAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Orçamento atualizado com sucesso."
            : "Orçamento criado com sucesso."
        );
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
          <DialogTitle>{isEditing ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
          <DialogDescription>
            Defina o limite mensal de gasto para uma categoria. O mesmo limite vale para
            todos os meses.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoria">Categoria</Label>
            <select
              id="categoria"
              disabled={isPending || isEditing}
              aria-invalid={!!form.formState.errors.categoria}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("categoria")}
            >
              <option value="">Selecione uma categoria...</option>
              {isEditing && <option value={orcamento.categoria}>{orcamento.categoria}</option>}
              {categoriasDisponiveis.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
            {form.formState.errors.categoria && (
              <p className="text-xs text-destructive">
                {form.formState.errors.categoria.message}
              </p>
            )}
            {!isEditing && categoriasDisponiveis.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todas as categorias de saída já têm orçamento definido.
              </p>
            )}
          </div>

          {/* Valor */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valor">Limite mensal (R$)</Label>
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
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Criar orçamento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
