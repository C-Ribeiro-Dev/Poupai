"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingCombobox } from "@/components/ui/floating-combobox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { contaSchema, TIPOS_CONTA, type ContaFormData, type ContaRow } from "@/types/contas";
import { CORES_DISPONIVEIS } from "@/lib/categorias-config";
import { createContaAction, updateContaAction } from "@/actions/contas";

interface ContaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaRow | null;
}

export function ContaFormDialog({ open, onOpenChange, conta }: ContaFormDialogProps) {
  const isEditing = !!conta;
  const [isPending, startTransition] = useTransition();

  const form = useForm<ContaFormData>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      nome: "",
      tipo: "corrente",
      instituicao: "",
      cor: "#3b82f6",
      saldoInicial: 0,
      ativo: true,
    },
  });

  const selectedCor = form.watch("cor");
  const ativo = form.watch("ativo");

  useEffect(() => {
    if (open) {
      form.reset({
        nome: conta?.nome ?? "",
        tipo: conta?.tipo ?? "corrente",
        instituicao: conta?.instituicao ?? "",
        cor: conta?.cor ?? "#3b82f6",
        saldoInicial: conta?.saldoInicial ?? 0,
        ativo: conta?.ativo ?? true,
      });
    }
  }, [open, conta, form]);

  function onSubmit(data: ContaFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateContaAction(conta.id, data)
        : await createContaAction(data);

      if (result.success) {
        toast.success(isEditing ? "Conta atualizada com sucesso." : "Conta criada com sucesso.");
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
          <DialogTitle>{isEditing ? "Editar conta" : "Nova conta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FloatingInput
            label="Nome"
            id="nome"
            placeholder="Ex: Nubank, Carteira, Poupança CEF"
            aria-invalid={!!form.formState.errors.nome}
            error={form.formState.errors.nome?.message}
            disabled={isPending}
            {...form.register("nome")}
          />

          <div className="grid grid-cols-2 gap-3">
            <FloatingCombobox
              label="Tipo"
              options={TIPOS_CONTA.map((t) => ({ value: t.key, label: t.label }))}
              value={form.watch("tipo") ?? "corrente"}
              onChange={(v) => form.setValue("tipo", v as ContaFormData["tipo"], { shouldValidate: true })}
              disabled={isPending}
              error={form.formState.errors.tipo?.message}
            />
            <FloatingInput
              label="Instituição (opcional)"
              id="instituicao"
              placeholder="Ex: Nubank, Itaú"
              disabled={isPending}
              {...form.register("instituicao")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FloatingInput
              label="Saldo inicial (R$)"
              id="saldoInicial"
              type="number"
              step="0.01"
              placeholder="0.00"
              aria-invalid={!!form.formState.errors.saldoInicial}
              error={form.formState.errors.saldoInicial?.message}
              disabled={isPending}
              {...form.register("saldoInicial", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Quanto a conta tem hoje — as movimentações somam a partir deste valor.
            </p>
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

          {isEditing && (
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-input">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => form.setValue("ativo", true, { shouldValidate: true })}
                  className={cn(
                    "py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    ativo
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  Ativa
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => form.setValue("ativo", false, { shouldValidate: true })}
                  className={cn(
                    "border-l border-input py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    !ativo
                      ? "bg-foreground/10 text-muted-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  Inativa
                </button>
              </div>
            </div>
          )}

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
                "Criar conta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
