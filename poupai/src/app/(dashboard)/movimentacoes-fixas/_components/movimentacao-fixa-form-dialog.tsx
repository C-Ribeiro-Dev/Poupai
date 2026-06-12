"use client";
import { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { CategoriaSelect } from "@/components/categoria-select";

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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ex: Aluguel, Netflix, Salário"
              aria-invalid={!!form.formState.errors.nome}
              disabled={isPending}
              {...form.register("nome")}
            />
            {form.formState.errors.nome && (
              <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de movimentação</Label>
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="tipoMovimentacaoId"
                render={({ field: { value, onChange } }) => (
                  <Select
                    value={value > 0 ? String(value) : null}
                    onValueChange={(v: string | null) =>
                      onChange(v !== null ? Number(v) : 0)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger
                      className={cn(
                        "flex-1",
                        form.formState.errors.tipoMovimentacaoId && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Selecione um tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tipos.length === 0 ? (
                        <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                          Nenhum tipo cadastrado
                        </div>
                      ) : (
                        tipos.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {/* isEntrada badge — derivado automaticamente do tipo, nunca do formulário */}
              {selectedTipo && (
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium",
                    selectedTipo.isEntrada
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-500/15 text-red-700 dark:text-red-400"
                  )}
                >
                  {selectedTipo.isEntrada ? "Entrada" : "Saída"}
                </span>
              )}
            </div>
            {form.formState.errors.tipoMovimentacaoId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.tipoMovimentacaoId.message}
              </p>
            )}
          </div>

          {/* Valor + Dia vencimento */}
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
              <Label htmlFor="diaVencimento">
                Dia de vencimento{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="diaVencimento"
                type="number"
                min="1"
                max="31"
                placeholder="Ex: 5, 15, 30"
                aria-invalid={!!form.formState.errors.diaVencimento}
                disabled={isPending}
                {...form.register("diaVencimento", {
                  setValueAs: (v: unknown) => {
                    if (v === "" || v === null || v === undefined) return undefined;
                    const n = parseInt(String(v), 10);
                    return isNaN(n) ? undefined : n;
                  },
                })}
              />
              {form.formState.errors.diaVencimento && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.diaVencimento.message}
                </p>
              )}
            </div>
          </div>

          {/* Data fim + Forma de pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataFim">
                Data fim{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="dataFim"
                type="date"
                disabled={isPending}
                {...form.register("dataFim")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="formaPagamento">
                Forma de pagamento{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="formaPagamento"
                placeholder="Ex: Pix, Boleto, Débito"
                aria-invalid={!!form.formState.errors.formaPagamento}
                disabled={isPending}
                {...form.register("formaPagamento")}
              />
              {form.formState.errors.formaPagamento && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.formaPagamento.message}
                </p>
              )}
            </div>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoria">
              Categoria{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <CategoriaSelect
              id="categoria"
              categorias={categorias}
              isEntrada={selectedTipo?.isEntrada ?? null}
              currentValue={movimentacaoFixa?.categoria ?? null}
              disabled={isPending}
              {...form.register("categoria")}
            />
            {form.formState.errors.categoria && (
              <p className="text-xs text-destructive">
                {form.formState.errors.categoria.message}
              </p>
            )}
          </div>

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
