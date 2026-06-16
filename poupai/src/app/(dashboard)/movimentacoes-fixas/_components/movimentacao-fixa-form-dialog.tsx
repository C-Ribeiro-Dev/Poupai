"use client";
import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  movimentacaoFixaSchema,
  type MovimentacaoFixaFormData,
  type MovimentacaoFixaRow,
} from "@/types/movimentacoes-fixas";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import {
  createMovimentacaoFixaAction,
  updateMovimentacaoFixaAction,
} from "@/actions/movimentacoes-fixas";

const toDateInputValue = (date: Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface MovimentacaoFixaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacaoFixa?: MovimentacaoFixaRow | null;
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
}

export function MovimentacaoFixaFormDialog({
  open,
  onOpenChange,
  movimentacaoFixa,
  tipos,
  categorias,
}: MovimentacaoFixaFormDialogProps) {
  const isEditing = !!movimentacaoFixa;
  const [isPending, startTransition] = useTransition();

  const form = useForm<MovimentacaoFixaFormData>({
    resolver: zodResolver(movimentacaoFixaSchema),
    defaultValues: {
      tipoMovimentacaoId: 0,
      nome: "",
      categoria: "",
      formaPagamento: "",
      observacoes: "",
      ativo: true,
    },
  });

  const selectedTipoId = form.watch("tipoMovimentacaoId");
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId);
  const ativo = form.watch("ativo");

  useEffect(() => {
    if (open) {
      form.reset({
        tipoMovimentacaoId: movimentacaoFixa?.tipoMovimentacaoId ?? 0,
        nome: movimentacaoFixa?.nome ?? "",
        valor: movimentacaoFixa?.valor ?? (undefined as unknown as number),
        diaVencimento: movimentacaoFixa?.diaVencimento ?? undefined,
        dataFim: movimentacaoFixa?.dataFim ? toDateInputValue(movimentacaoFixa.dataFim) : "",
        categoria: movimentacaoFixa?.categoria ?? "",
        formaPagamento: movimentacaoFixa?.formaPagamento ?? "",
        observacoes: movimentacaoFixa?.observacoes ?? "",
        ativo: movimentacaoFixa?.ativo ?? true,
      });
    }
  }, [open, movimentacaoFixa, form]);

  function onSubmit(data: MovimentacaoFixaFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateMovimentacaoFixaAction(movimentacaoFixa.id, data)
        : await createMovimentacaoFixaAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Movimentação fixa atualizada com sucesso."
            : "Movimentação fixa criada com sucesso."
        );
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar movimentação fixa" : "Nova movimentação fixa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Nome */}
          <FloatingInput
            label="Nome"
            id="nome"
            aria-invalid={!!form.formState.errors.nome}
            error={form.formState.errors.nome?.message}
            disabled={isPending}
            {...form.register("nome")}
          />

          {/* Tipo */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Controller
                control={form.control}
                name="tipoMovimentacaoId"
                render={({ field }) => (
                  <FloatingCombobox
                    label="Tipo de movimentação"
                    options={tipos.map((t) => ({ value: String(t.id), label: t.nome }))}
                    value={field.value ? String(field.value) : ""}
                    onChange={(v) => field.onChange(v ? Number(v) : 0)}
                    disabled={isPending}
                    error={form.formState.errors.tipoMovimentacaoId?.message}
                  />
                )}
              />
            </div>
            {/* isEntrada badge — derivado automaticamente do tipo, nunca do formulário */}
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

          {/* Valor + Dia vencimento */}
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
              label="Dia de vencimento (opcional)"
              id="diaVencimento"
              type="number"
              min="1"
              max="31"
              aria-invalid={!!form.formState.errors.diaVencimento}
              error={form.formState.errors.diaVencimento?.message}
              disabled={isPending}
              {...form.register("diaVencimento", {
                setValueAs: (v: unknown) => {
                  if (v === "" || v === null || v === undefined) return undefined;
                  const n = parseInt(String(v), 10);
                  return isNaN(n) ? undefined : n;
                },
              })}
            />
          </div>

          {/* Data fim + Forma de pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Data fim (opcional)"
              id="dataFim"
              type="date"
              disabled={isPending}
              {...form.register("dataFim")}
            />

            <FloatingInput
              label="Forma de pagamento (opcional)"
              id="formaPagamento"
              aria-invalid={!!form.formState.errors.formaPagamento}
              error={form.formState.errors.formaPagamento?.message}
              disabled={isPending}
              {...form.register("formaPagamento")}
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

          {/* Observações */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observacoes">
              Observações{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione detalhes ou notas sobre esta movimentação fixa"
              rows={2}
              aria-invalid={!!form.formState.errors.observacoes}
              disabled={isPending}
              {...form.register("observacoes")}
            />
            {form.formState.errors.observacoes && (
              <p className="text-xs text-destructive">
                {form.formState.errors.observacoes.message}
              </p>
            )}
          </div>

          {/* Ativo */}
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-input">
              <button
                type="button"
                disabled={isPending}
                onClick={() => form.setValue("ativo", true, { shouldValidate: true })}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  ativo
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Ativo
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => form.setValue("ativo", false, { shouldValidate: true })}
                className={cn(
                  "flex items-center justify-center gap-2 border-l border-input py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  !ativo
                    ? "bg-foreground/10 text-muted-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Inativo
              </button>
            </div>
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
                "Criar movimentação fixa"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
