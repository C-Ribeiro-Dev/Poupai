"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ArrowRight, Receipt, SkipForward } from "lucide-react";
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
import { marcarComoPagoAction, pularCicloAction } from "@/actions/movimentacoes-fixas";
import type { MovimentacaoFixaRow } from "@/types/movimentacoes-fixas";

type Modo = "registrar" | "pular";

interface PagarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacaoFixa: MovimentacaoFixaRow | null;
}

export function PagarDialog({ open, onOpenChange, movimentacaoFixa: m }: PagarDialogProps) {
  const [modo, setModo] = useState<Modo>("registrar");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!m) return;
    startTransition(async () => {
      const result =
        modo === "registrar"
          ? await marcarComoPagoAction(m.id)
          : await pularCicloAction(m.id);

      if (result.success) {
        toast.success(
          modo === "registrar" ? "Pagamento registrado." : "Ciclo pulado.",
          {
            description:
              modo === "registrar"
                ? "Movimentação criada em Movimentações."
                : "Marcado como pago sem gerar movimentação.",
          }
        );
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
    <Dialog open={open} onOpenChange={isPending ? undefined : (v) => { if (!v) setModo("registrar"); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>

        {m && (
          <div className="flex flex-col gap-4">
            {/* Resumo da fixa */}
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

            {/* Seleção de modo */}
            <div className="flex flex-col gap-2">
              {/* Opção: Registrar pagamento */}
              <button
                type="button"
                onClick={() => setModo("registrar")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  modo === "registrar"
                    ? "border-emerald-400/60 bg-emerald-500/5 dark:border-emerald-700"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  modo === "registrar" ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground"
                )}>
                  {modo === "registrar" && <div className="size-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Registrar pagamento</span>
                  <span className="text-xs text-muted-foreground">
                    Marca como pago e cria uma movimentação de <span className="font-medium">{formatCurrency(m.valor)}</span> no histórico.
                    Use quando o dinheiro entrou ou saiu agora.
                  </span>
                  {modo === "registrar" && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Receipt className="size-3 text-blue-500" />
                      <span>Movimentação em: {hojeCapital}</span>
                    </div>
                  )}
                </div>
              </button>

              {/* Opção: Pular este ciclo */}
              <button
                type="button"
                onClick={() => setModo("pular")}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  modo === "pular"
                    ? "border-indigo-400/60 bg-indigo-500/5 dark:border-indigo-700"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  modo === "pular" ? "border-indigo-500 bg-indigo-500" : "border-muted-foreground"
                )}>
                  {modo === "pular" && <div className="size-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Pular este ciclo</span>
                  <span className="text-xs text-muted-foreground">
                    Marca como pago <span className="font-medium">sem criar movimentação</span>.
                    Use quando já foi pago/recebido fora do sistema e não quer que afete o saldo.
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { setModo("registrar"); onOpenChange(false); }}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            className={cn(
              "text-white",
              modo === "registrar"
                ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700"
            )}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {modo === "registrar" ? "Registrando..." : "Pulando..."}
              </>
            ) : modo === "registrar" ? (
              <>
                <CheckCircle2 className="size-4" />
                Confirmar pagamento
              </>
            ) : (
              <>
                <SkipForward className="size-4" />
                Pular este ciclo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
