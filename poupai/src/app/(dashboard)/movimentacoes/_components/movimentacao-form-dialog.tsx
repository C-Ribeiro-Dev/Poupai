"use client";
import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, todayStr, toDateInputValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  movimentacaoSchema,
  type MovimentacaoFormData,
  type MovimentacaoRow,
} from "@/types/movimentacoes";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import type { ContaRow } from "@/types/contas";
import { createMovimentacaoAction, updateMovimentacaoAction } from "@/actions/movimentacoes";


interface MovimentacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao?: MovimentacaoRow | null;
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
  contas: ContaRow[];
}

export function MovimentacaoFormDialog({
  open,
  onOpenChange,
  movimentacao,
  tipos,
  categorias,
  contas,
}: MovimentacaoFormDialogProps) {
  const isEditing = !!movimentacao;
  const [isPending, startTransition] = useTransition();

  const form = useForm<MovimentacaoFormData>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: {
      tipoId: 0,
      data: todayStr(),
      categoria: "",
      descricao: "",
      contaId: undefined,
    },
  });

  const selectedTipoId = form.watch("tipoId");
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId);

  useEffect(() => {
    if (open) {
      form.reset({
        tipoId: movimentacao?.tipoId ?? 0,
        valor: movimentacao?.valor ?? NaN,
        data: movimentacao ? toDateInputValue(movimentacao.data) : todayStr(),
        categoria: movimentacao?.categoria ?? "",
        descricao: movimentacao?.descricao ?? "",
        contaId: movimentacao?.contaId ?? undefined,
      });
    }
  }, [open, movimentacao, form]);

  function onSubmit(data: MovimentacaoFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateMovimentacaoAction(movimentacao.id, data)
        : await createMovimentacaoAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Movimentação atualizada com sucesso."
            : "Movimentação criada com sucesso."
        );
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar movimentação" : "Nova movimentação"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Tipo */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Controller
                control={form.control}
                name="tipoId"
                render={({ field }) => (
                  <FloatingCombobox
                    label="Tipo de movimentação"
                    options={tipos.map((t) => ({ value: String(t.id), label: t.nome }))}
                    value={field.value ? String(field.value) : ""}
                    onChange={(v) => field.onChange(v ? Number(v) : 0)}
                    disabled={isPending}
                    error={form.formState.errors.tipoId?.message}
                  />
                )}
              />
            </div>
            {/* isEntrada badge — derivado automaticamente do tipo, nunca do form */}
            {selectedTipo && (
              <span
                className={cn(
                  "mb-0.5 shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
                  selectedTipo.isEntrada
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-500/15 text-red-700 dark:text-red-400"
                )}
              >
                {selectedTipo.isEntrada ? "Entrada" : "Saída"}
              </span>
            )}
          </div>

          {/* Valor + Data */}
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
              aria-invalid={!!form.formState.errors.data}
              error={form.formState.errors.data?.message}
              disabled={isPending}
              {...form.register("data")}
            />
          </div>

          {/* Categoria */}
          <FloatingCombobox
            label="Categoria (opcional)"
            options={categorias
              .filter((c) => c.ativo && (selectedTipo == null || c.tipo === "ambos" || (selectedTipo.isEntrada ? c.tipo === "entrada" : c.tipo === "saida")))
              .map((c) => ({ value: c.nome, label: c.nome }))}
            value={form.watch("categoria") ?? ""}
            onChange={(v) => form.setValue("categoria", v, { shouldValidate: true })}
            disabled={isPending}
            error={form.formState.errors.categoria?.message}
          />

          {/* Conta */}
          {contas.length > 0 && (
            <Controller
              control={form.control}
              name="contaId"
              render={({ field }) => (
                <FloatingCombobox
                  label="Conta (opcional)"
                  options={contas.map((c) => ({ value: String(c.id), label: c.nome }))}
                  value={field.value ? String(field.value) : ""}
                  onChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  disabled={isPending}
                  error={form.formState.errors.contaId?.message}
                />
              )}
            />
          )}

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">
              Descrição{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="descricao"
              placeholder="Adicione detalhes sobre esta movimentação"
              rows={3}
              aria-invalid={!!form.formState.errors.descricao}
              disabled={isPending}
              {...form.register("descricao")}
            />
            {form.formState.errors.descricao && (
              <p className="text-xs text-destructive">
                {form.formState.errors.descricao.message}
              </p>
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
                "Criar movimentação"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
