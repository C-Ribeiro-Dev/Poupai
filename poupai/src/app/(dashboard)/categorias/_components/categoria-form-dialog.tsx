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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { categoriaSchema, type CategoriaFormData, type CategoriaRow } from "@/types/categorias";
import { ICONES_DISPONIVEIS, CORES_DISPONIVEIS, getCategoriaIcon } from "@/lib/categorias-config";
import { createCategoriaAction, updateCategoriaAction } from "@/actions/categorias";

type Tipo = "entrada" | "saida" | "ambos";

const tipoOptions: { key: Tipo; label: string }[] = [
  { key: "entrada", label: "Entrada" },
  { key: "saida", label: "Saída" },
  { key: "ambos", label: "Ambos" },
];

interface CategoriaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria?: CategoriaRow | null;
}

export function CategoriaFormDialog({ open, onOpenChange, categoria }: CategoriaFormDialogProps) {
  const isEditing = !!categoria;
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      cor: "#6b7280",
      icone: "tag",
      tipo: "ambos",
      ativo: true,
    },
  });

  const selectedCor = form.watch("cor");
  const selectedIcone = form.watch("icone");
  const selectedTipo = form.watch("tipo");
  const ativo = form.watch("ativo");

  const PreviewIcon = getCategoriaIcon(selectedIcone);

  useEffect(() => {
    if (open) {
      form.reset({
        nome: categoria?.nome ?? "",
        cor: categoria?.cor ?? "#6b7280",
        icone: categoria?.icone ?? "tag",
        tipo: categoria?.tipo ?? "ambos",
        ativo: categoria?.ativo ?? true,
      });
    }
  }, [open, categoria, form]);

  function onSubmit(data: CategoriaFormData) {
    startTransition(async () => {
      const result = isEditing
        ? await updateCategoriaAction(categoria.id, data)
        : await createCategoriaAction(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Categoria atualizada com sucesso."
            : "Categoria criada com sucesso."
        );
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
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Preview + Nome */}
          <div className="flex items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors"
              style={{ backgroundColor: `${selectedCor}22` }}
            >
              <PreviewIcon className="size-6" style={{ color: selectedCor }} />
            </div>
            <div className="flex-1">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Ex: Alimentação, Salário"
                className="mt-1"
                aria-invalid={!!form.formState.errors.nome}
                disabled={isPending}
                {...form.register("nome")}
              />
              {form.formState.errors.nome && (
                <p className="mt-0.5 text-xs text-destructive">{form.formState.errors.nome.message}</p>
              )}
            </div>
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-input">
              {tipoOptions.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  disabled={isPending}
                  onClick={() => form.setValue("tipo", t.key, { shouldValidate: true })}
                  className={cn(
                    "py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    "[&:not(:first-child)]:border-l [&:not(:first-child)]:border-input",
                    selectedTipo === t.key
                      ? t.key === "entrada"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                        : t.key === "saida"
                          ? "bg-red-500/15 text-red-700 dark:text-red-400"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-400"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
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
                  {selectedCor === c.key && (
                    <Check className="size-3.5 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div className="flex flex-col gap-1.5">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-1.5">
              {ICONES_DISPONIVEIS.map((ico) => {
                const Ico = ico.icon;
                return (
                  <button
                    key={ico.key}
                    type="button"
                    disabled={isPending}
                    onClick={() => form.setValue("icone", ico.key, { shouldValidate: true })}
                    title={ico.label}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedIcone === ico.key
                        ? "text-foreground ring-2 ring-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    style={
                      selectedIcone === ico.key
                        ? { backgroundColor: `${selectedCor}22`, color: selectedCor }
                        : {}
                    }
                  >
                    <Ico className="size-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status */}
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
                "Salvar"
              ) : (
                "Criar categoria"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
