"use client";
import { useTransition } from "react";
import { CheckCircle2, Loader2, ArrowRight, Receipt } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { marcarComoPagoAction } from "@/actions/movimentacoes-fixas";
import type { MovimentacaoFixaRow } from "@/types/movimentacoes-fixas";

interface PagarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacaoFixa: MovimentacaoFixaRow | null;
}

export function PagarDialog({ open, onOpenChange, movimentacaoFixa: m }: PagarDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!m) return;
    startTransition(async () => {
      const result = await marcarComoPagoAction(m.id);
      if (result.success) {
        toast.success("Pagamento registrado.", {
          description: "Movimentação criada em Movimentações.",
        });
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const hoje = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const hojeCapital = hoje.charAt(0).toUpperCase() + hoje.slice(1);

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Confirmar pagamento</DialogTitle>
        </DialogHeader>

        {m && (
          <div className="flex flex-col gap-4">
            {/* Card de resumo do que será pago */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{m.nome}</span>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{m.tipoNome}</span>
                    <span>·</span>
                    <span
                      className={cn(
                        "font-medium",
                        m.isEntrada
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {m.isEntrada ? "Entrada" : "Saída"}
                    </span>
                    {m.formaPagamento && (
                      <>
                        <span>·</span>
                        <span>{m.formaPagamento}</span>
                      </>
                    )}
                  </div>
                  {m.categoria && (
                    <span className="text-xs text-muted-foreground">{m.categoria}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xl font-bold tabular-nums",
                    m.isEntrada
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  )}
                >
                  {formatCurrency(m.valor)}
                </span>
              </div>
            </div>

            {/* O que acontecerá */}
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                O que será feito
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <span>
                    Marcar <span className="font-medium">{m.nome}</span> como pago
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Receipt className="size-4 shrink-0 text-blue-500" />
                  <span>
                    Criar movimentação de{" "}
                    <span className="font-medium">{formatCurrency(m.valor)}</span> em{" "}
                    <span className="font-medium">Movimentações</span>
                  </span>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowRight className="size-3" />
                <span>Data: {hojeCapital}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Confirmar pagamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
