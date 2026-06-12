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
  movimentacaoSchema,
  type MovimentacaoFormData,
  type MovimentacaoRow,
} from "@/types/movimentacoes";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import { createMovimentacaoAction, updateMovimentacaoAction } from "@/actions/movimentacoes";

import { CategoriaSelect } from "@/components/categoria-select";

const todayStr = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const toDateInputValue = (date: Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface MovimentacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao?: MovimentacaoRow | null;
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
}

export function MovimentacaoFormDialog({
  open,
  onOpenChange,
  movimentacao,
  tipos,
  categorias,
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
    },
  });

  const selectedTipoId = form.watch("tipoId");
  const selectedTipo = tipos.find((t) => t.id === selectedTipoId);

  useEffect(() => {
    if (open) {
      form.reset({
        tipoId: movimentacao?.tipoId ?? 0,
        valor: movimentacao?.valor ?? (undefined as unknown as number),
        data: movimentacao ? toDateInputValue(movimentacao.data) : todayStr(),
        categoria: movimentacao?.categoria ?? "",
        descricao: movimentacao?.descricao ?? "",
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
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de movimentação</Label>
            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="tipoId"
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
                        form.formState.errors.tipoId && "border-destructive"
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
              {/* isEntrada badge — derivado automaticamente do tipo, nunca do form */}
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
            {form.formState.errors.tipoId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.tipoId.message}
              </p>
            )}
          </div>

          {/* Valor + Data */}
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
                <p className="text-xs text-destructive">
                  {form.formState.errors.valor.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                aria-invalid={!!form.formState.errors.data}
                disabled={isPending}
                {...form.register("data")}
              />
              {form.formState.errors.data && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.data.message}
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
              currentValue={movimentacao?.categoria ?? null}
              disabled={isPending}
              {...form.register("categoria")}
            />
            {form.formState.errors.categoria && (
              <p className="text-xs text-destructive">
                {form.formState.errors.categoria.message}
              </p>
            )}
          </div>

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
