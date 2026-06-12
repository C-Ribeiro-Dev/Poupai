"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { metaSchema, type MetaFormData, type MetaRow } from "@/types/metas";
import { CORES_DISPONIVEIS } from "@/lib/categorias-config";
import { createMetaAction, updateMetaAction } from "@/actions/metas";

const toDateInputValue = (date: Date): string => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface MetaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta?: MetaRow | null;
}

export function MetaFormDialog({ open, onOpenChange, meta }: MetaFormDialogProps) {
  const isEditing = !!meta;
  const [isPending, startTransition] = useTransition();

  const form = useForm<MetaFormData>({
    resolver: zodResolver(metaSchema),
    defaultValues: { nome: "", descricao: "", dataAlvo: "", cor: "#22c55e" },
  });

  const selectedCor = form.watch("cor");

  useEffect(() => {
    if (open) {
      form.reset({
        nome: meta?.nome ?? "",
        descricao: meta?.descricao ?? "",
        valorAlvo: meta?.valorAlvo ?? (undefined as unknown as number),
        dataAlvo: meta?.dataAlvo ? toDateInputValue(meta.dataAlvo) : "",
        cor: meta?.cor ?? "#22c55e",
      });
    }
  }, [open, meta, form]);

  function onSubmit(data: MetaFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateMetaAction(meta.id, data)
        : await createMetaAction(data);

      if (result.success) {
        toast.success(isEditing ? "Meta atualizada com sucesso." : "Meta criada com sucesso.");
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
          <DialogTitle>{isEditing ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              placeholder="Ex: Reserva de emergência, Viagem"
              aria-invalid={!!form.formState.errors.nome}
              disabled={isPending}
              {...form.register("nome")}
            />
            {form.formState.errors.nome && (
              <p className="text-xs text-destructive">{form.formState.errors.nome.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="valorAlvo">Valor da meta (R$)</Label>
              <Input
                id="valorAlvo"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                aria-invalid={!!form.formState.errors.valorAlvo}
                disabled={isPending}
                {...form.register("valorAlvo", { valueAsNumber: true })}
              />
              {form.formState.errors.valorAlvo && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.valorAlvo.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dataAlvo">
                Prazo{" "}
                <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
              </Label>
              <Input id="dataAlvo" type="date" disabled={isPending} {...form.register("dataAlvo")} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descricao">
              Descrição{" "}
              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="descricao"
              rows={2}
              placeholder="Detalhes sobre o objetivo"
              disabled={isPending}
              {...form.register("descricao")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {CORES_DISPONIVEIS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  disabled={isPending}
                  onClick={() => form.setValue("cor", c.key, { shouldValidate: true })}
                  title={c.label}
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selectedCor === c.key && "ring-2 ring-offset-2 ring-offset-background"
                  )}
                  style={{
                    backgroundColor: c.key,
                    ...(selectedCor === c.key
                      ? ({ "--tw-ring-color": c.key } as React.CSSProperties)
                      : {}),
                  }}
                >
                  {selectedCor === c.key && <Check className="size-3.5 text-white drop-shadow" />}
                </button>
              ))}
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
                "Criar meta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
