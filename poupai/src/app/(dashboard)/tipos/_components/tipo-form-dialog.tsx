"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tipoMovimentacaoSchema, type TipoMovimentacaoFormData, type TipoMovimentacaoRow } from "@/types/tipos";
import { createTipoAction, updateTipoAction } from "@/actions/tipos";

interface TipoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo?: TipoMovimentacaoRow | null;
}

export function TipoFormDialog({ open, onOpenChange, tipo }: TipoFormDialogProps) {
  const isEditing = !!tipo;
  const [isPending, startTransition] = useTransition();

  const form = useForm<TipoMovimentacaoFormData>({
    resolver: zodResolver(tipoMovimentacaoSchema),
    defaultValues: { nome: "", descricao: "", isEntrada: false },
  });

  const isEntrada = form.watch("isEntrada");

  useEffect(() => {
    if (open) {
      form.reset({
        nome: tipo?.nome ?? "",
        descricao: tipo?.descricao ?? "",
        isEntrada: tipo?.isEntrada ?? false,
      });
    }
  }, [open, tipo, form]);

  function onSubmit(data: TipoMovimentacaoFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateTipoAction(tipo.id, data)
        : await createTipoAction(data);

      if (result.success) {
        toast.success(isEditing ? "Tipo atualizado com sucesso." : "Tipo criado com sucesso.");
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
          <DialogTitle>
            {isEditing ? "Editar tipo de movimentação" : "Novo tipo de movimentação"}
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

          {/* Tipo: Entrada / Saída */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-input">
              <button
                type="button"
                disabled={isPending}
                onClick={() => form.setValue("isEntrada", true, { shouldValidate: true })}
                className={cn(
                  "flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors",
                  isEntrada
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Entrada
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => form.setValue("isEntrada", false, { shouldValidate: true })}
                className={cn(
                  "flex items-center justify-center gap-2 border-l border-input py-2 text-sm font-medium transition-colors",
                  !isEntrada
                    ? "bg-red-500/15 text-red-700 dark:text-red-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Saída
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">
              Descrição{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descreva este tipo de movimentação"
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
                "Criar tipo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
