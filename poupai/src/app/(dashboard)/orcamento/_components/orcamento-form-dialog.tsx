"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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

  const categoriaOptions = isEditing
    ? [{ value: orcamento.categoria, label: orcamento.categoria }, ...categoriasDisponiveis.map((c) => ({ value: c.nome, label: c.nome }))]
    : categoriasDisponiveis.map((c) => ({ value: c.nome, label: c.nome }));

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
            <FloatingCombobox
              label="Categoria"
              options={categoriaOptions}
              value={form.watch("categoria") ?? ""}
              onChange={(v) => form.setValue("categoria", v, { shouldValidate: true })}
              disabled={isPending || isEditing}
              error={form.formState.errors.categoria?.message}
            />
            {!isEditing && categoriasDisponiveis.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Todas as categorias de saída já têm orçamento definido.
              </p>
            )}
          </div>

          {/* Valor */}
          <FloatingInput
            label="Limite mensal (R$)"
            id="valor"
            type="number"
            step="0.01"
            min="0.01"
            aria-invalid={!!form.formState.errors.valor}
            error={form.formState.errors.valor?.message}
            disabled={isPending}
            {...form.register("valor", { valueAsNumber: true })}
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
