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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ativoSchema,
  CLASSES_INVESTIMENTO,
  type AtivoFormData,
  type AtivoRow,
} from "@/types/investimentos";
import { createAtivoAction, updateAtivoAction } from "@/actions/investimentos";

interface AtivoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ativo?: AtivoRow | null;
}

export function AtivoFormDialog({ open, onOpenChange, ativo }: AtivoFormDialogProps) {
  const isEditing = !!ativo;
  const [isPending, startTransition] = useTransition();

  const form = useForm<AtivoFormData>({
    resolver: zodResolver(ativoSchema),
    defaultValues: { nome: "", classe: "renda_fixa" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: ativo?.nome ?? "",
        classe: (ativo?.classe as AtivoFormData["classe"]) ?? "renda_fixa",
        valorAtual: ativo?.valorAtualManual ?? undefined,
      });
    }
  }, [open, ativo, form]);

  function onSubmit(data: AtivoFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateAtivoAction(ativo.id, data)
        : await createAtivoAction(data);

      if (result.success) {
        toast.success(isEditing ? "Ativo atualizado com sucesso." : "Ativo criado com sucesso.");
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
          <DialogTitle>{isEditing ? "Editar ativo" : "Novo ativo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FloatingInput
            label="Nome"
            id="nome"
            aria-invalid={!!form.formState.errors.nome}
            error={form.formState.errors.nome?.message}
            disabled={isPending}
            {...form.register("nome")}
          />

          <FloatingCombobox
            label="Classe"
            options={CLASSES_INVESTIMENTO.map((c) => ({ value: c.key, label: c.label }))}
            value={form.watch("classe") ?? "renda_fixa"}
            onChange={(v) => form.setValue("classe", v as AtivoFormData["classe"], { shouldValidate: true })}
            disabled={isPending}
            error={form.formState.errors.classe?.message}
          />

          <FloatingInput
            label="Valor atual (R$) (opcional)"
            id="valorAtual"
            type="number"
            step="0.01"
            min="0"
            aria-invalid={!!form.formState.errors.valorAtual}
            error={form.formState.errors.valorAtual?.message}
            disabled={isPending}
            {...form.register("valorAtual", {
              setValueAs: (v: unknown) => {
                if (v === "" || v === null || v === undefined) return undefined;
                const n = Number(v);
                return isNaN(n) ? undefined : n;
              },
            })}
          />
          <p className="text-xs text-muted-foreground">
            Atualize de tempos em tempos para calcular a rentabilidade. Sem este valor, usamos o
            total aportado.
          </p>

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
                "Criar ativo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
