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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ex: Tesouro Selic, PETR4, Bitcoin"
              aria-invalid={!!form.formState.errors.nome}
              disabled={isPending}
              {...form.register("nome")}
            />
            {form.formState.errors.nome && (
              <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="classe">Classe</Label>
            <select
              id="classe"
              disabled={isPending}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register("classe")}
            >
              {CLASSES_INVESTIMENTO.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valorAtual">
              Valor atual (R$){" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="valorAtual"
              type="number"
              step="0.01"
              min="0"
              placeholder="Quanto vale hoje"
              aria-invalid={!!form.formState.errors.valorAtual}
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
                "Criar ativo"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
