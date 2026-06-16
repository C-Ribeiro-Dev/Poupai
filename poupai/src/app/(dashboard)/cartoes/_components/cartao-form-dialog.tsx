"use client";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cartaoSchema, type CartaoFormData, type CartaoRow } from "@/types/cartoes";
import { CORES_DISPONIVEIS } from "@/lib/categorias-config";
import { createCartaoAction, updateCartaoAction } from "@/actions/cartoes";

interface CartaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao?: CartaoRow | null;
}

export function CartaoFormDialog({ open, onOpenChange, cartao }: CartaoFormDialogProps) {
  const isEditing = !!cartao;
  const [isPending, startTransition] = useTransition();

  const form = useForm<CartaoFormData>({
    resolver: zodResolver(cartaoSchema),
    defaultValues: { nome: "", bandeira: "", cor: "#8b5cf6" },
  });

  const selectedCor = form.watch("cor");

  useEffect(() => {
    if (open) {
      form.reset({
        nome: cartao?.nome ?? "",
        bandeira: cartao?.bandeira ?? "",
        limite: cartao?.limite ?? (undefined as unknown as number),
        diaFechamento: cartao?.diaFechamento ?? (undefined as unknown as number),
        diaVencimento: cartao?.diaVencimento ?? (undefined as unknown as number),
        cor: cartao?.cor ?? "#8b5cf6",
      });
    }
  }, [open, cartao, form]);

  function onSubmit(data: CartaoFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateCartaoAction(cartao.id, data)
        : await createCartaoAction(data);

      if (result.success) {
        toast.success(isEditing ? "Cartão atualizado com sucesso." : "Cartão criado com sucesso.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const intRegister = (name: "diaFechamento" | "diaVencimento") =>
    form.register(name, {
      setValueAs: (v: unknown) => {
        if (v === "" || v === null || v === undefined) return undefined;
        const n = parseInt(String(v), 10);
        return isNaN(n) ? undefined : n;
      },
    });

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cartão" : "Novo cartão"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Nome"
              id="nome"
              placeholder="Ex: Nubank, Inter"
              aria-invalid={!!form.formState.errors.nome}
              error={form.formState.errors.nome?.message}
              disabled={isPending}
              {...form.register("nome")}
            />
            <FloatingInput
              label="Bandeira (opcional)"
              id="bandeira"
              placeholder="Ex: Mastercard"
              disabled={isPending}
              {...form.register("bandeira")}
            />
          </div>

          <FloatingInput
            label="Limite (R$)"
            id="limite"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            aria-invalid={!!form.formState.errors.limite}
            error={form.formState.errors.limite?.message}
            disabled={isPending}
            {...form.register("limite", { valueAsNumber: true })}
          />

          <div className="grid grid-cols-2 gap-3">
            <FloatingInput
              label="Dia do fechamento"
              id="diaFechamento"
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 10"
              aria-invalid={!!form.formState.errors.diaFechamento}
              error={form.formState.errors.diaFechamento?.message}
              disabled={isPending}
              {...intRegister("diaFechamento")}
            />
            <FloatingInput
              label="Dia do vencimento"
              id="diaVencimento"
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 17"
              aria-invalid={!!form.formState.errors.diaVencimento}
              error={form.formState.errors.diaVencimento?.message}
              disabled={isPending}
              {...intRegister("diaVencimento")}
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
                "Criar cartão"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
