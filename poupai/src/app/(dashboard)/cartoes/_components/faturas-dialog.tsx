"use client";
import { useEffect, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Undo2,
  Trash2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CartaoRow } from "@/types/cartoes";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import { mesRefLabel } from "@/lib/cartao-fatura";
import {
  pagarFaturaAction,
  desfazerPagamentoFaturaAction,
  deleteCompraCartaoAction,
} from "@/actions/cartoes";

const statusBadge: Record<string, string> = {
  paga: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  aberta: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  fechada: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  futura: "bg-foreground/8 text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  paga: "Paga",
  aberta: "Aberta",
  fechada: "Fechada",
  futura: "Futura",
};

interface FaturasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: CartaoRow | null;
  tipos: TipoMovimentacaoRow[];
}

export function FaturasDialog({ open, onOpenChange, cartao, tipos }: FaturasDialogProps) {
  const [indice, setIndice] = useState(0);
  const [tipoId, setTipoId] = useState(0);
  const [isPending, startTransition] = useTransition();

  const faturas = cartao?.faturas ?? [];
  const tiposSaida = tipos.filter((t) => !t.isEntrada);

  useEffect(() => {
    if (open && cartao) {
      // Abre na fatura atual (ou na primeira não paga)
      const atualIdx = cartao.faturaAtual
        ? cartao.faturas.findIndex((f) => f.mesRef === cartao.faturaAtual!.mesRef)
        : 0;
      setIndice(Math.max(atualIdx, 0));
      setTipoId(0);
    }
  }, [open, cartao]);

  const fatura = faturas[indice];

  function handlePagar() {
    if (!cartao || !fatura) return;
    if (!tipoId) {
      toast.error("Selecione o tipo de movimentação para registrar o pagamento.");
      return;
    }
    startTransition(async () => {
      const result = await pagarFaturaAction(cartao.id, fatura.mesRef, fatura.total, tipoId);
      if (result.success) {
        toast.success("Fatura paga com sucesso.", {
          description: "Movimentação criada em Movimentações.",
        });
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDesfazer() {
    if (!cartao || !fatura) return;
    startTransition(async () => {
      const result = await desfazerPagamentoFaturaAction(cartao.id, fatura.mesRef);
      if (result.success) {
        toast.success("Pagamento desfeito.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteCompra(compraId: number) {
    startTransition(async () => {
      const result = await deleteCompraCartaoAction(compraId);
      if (result.success) {
        toast.success("Compra excluída (todas as parcelas).");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!cartao) return null;

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5" style={{ color: cartao.cor }} />
            Faturas — {cartao.nome}
          </DialogTitle>
        </DialogHeader>

        {fatura ? (
          <div className="flex flex-col gap-4">
            {/* Navegação entre faturas */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={indice === 0 || isPending}
                onClick={() => setIndice((i) => i - 1)}
                aria-label="Fatura anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="text-center">
                <p className="text-sm font-medium">{mesRefLabel(fatura.mesRef)}</p>
                <span
                  className={cn(
                    "mt-0.5 inline-block rounded-md px-2 py-0.5 text-xs font-medium",
                    statusBadge[fatura.status]
                  )}
                >
                  {statusLabel[fatura.status]}
                  {!fatura.paga && ` · vence ${formatDate(fatura.vencimento)}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={indice >= faturas.length - 1 || isPending}
                onClick={() => setIndice((i) => i + 1)}
                aria-label="Próxima fatura"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            {/* Total */}
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Total da fatura</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(fatura.total)}</p>
            </div>

            {/* Itens */}
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <div className="divide-y divide-border">
                {fatura.itens.map((item, idx) => (
                  <div key={`${item.compraId}-${idx}`} className="group flex items-center gap-3 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.descricao}
                        {item.totalParcelas > 1 && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {item.parcelaNum}/{item.totalParcelas}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.responsavel ? (
                          <span className="mr-1.5 rounded bg-amber-500/15 px-1 py-0.5 text-amber-700 dark:text-amber-400">
                            {item.responsavel}
                          </span>
                        ) : null}
                        {item.categoria ? `${item.categoria} · ` : ""}
                        compra em {formatDate(item.dataCompra)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(item.valorParcela)}
                    </span>
                    {!fatura.paga && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isPending}
                        onClick={() => handleDeleteCompra(item.compraId)}
                        aria-label={`Excluir compra ${item.descricao}`}
                        className="text-destructive transition-opacity hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagamento */}
            {!fatura.paga && fatura.total > 0 && fatura.status !== "futura" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tipoPagamento">Tipo de movimentação do pagamento</Label>
                <select
                  id="tipoPagamento"
                  value={tipoId || ""}
                  onChange={(e) => setTipoId(Number(e.target.value) || 0)}
                  disabled={isPending}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione o tipo (saída)...</option>
                  {tiposSaida.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Ao pagar, uma movimentação de saída é criada automaticamente.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                Fechar
              </Button>
              {fatura.paga ? (
                <Button variant="outline" onClick={handleDesfazer} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Undo2 className="size-4" />
                  )}
                  Desfazer pagamento
                </Button>
              ) : (
                fatura.total > 0 &&
                fatura.status !== "futura" && (
                  <Button onClick={handlePagar} disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Pagando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        Pagar {formatCurrency(fatura.total)}
                      </>
                    )}
                  </Button>
                )
              )}
            </DialogFooter>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma fatura para exibir.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
