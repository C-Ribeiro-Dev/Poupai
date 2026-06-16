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
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
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
  parcial: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  aberta: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  fechada: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  futura: "bg-foreground/8 text-muted-foreground",
};

const statusLabel: Record<string, string> = {
  paga: "Paga",
  parcial: "Parcialmente paga",
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
  const [valorPagamento, setValorPagamento] = useState(0);
  const [isPending, startTransition] = useTransition();

  const faturas = cartao?.faturas ?? [];
  const tiposSaida = tipos.filter((t) => !t.isEntrada);

  useEffect(() => {
    if (open && cartao) {
      const atualIdx = cartao.faturaAtual
        ? cartao.faturas.findIndex((f) => f.mesRef === cartao.faturaAtual!.mesRef)
        : 0;
      setIndice(Math.max(atualIdx, 0));
      setTipoId(0);
    }
  }, [open, cartao]);

  const fatura = faturas[indice];
  const restante = fatura ? Math.max(0, Math.round((fatura.total - fatura.totalPago) * 100) / 100) : 0;

  // Atualiza o valor de pagamento sugerido quando muda de fatura
  useEffect(() => {
    if (fatura) {
      setValorPagamento(restante);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fatura?.mesRef, fatura?.total, fatura?.totalPago]);

  function handlePagar() {
    if (!cartao || !fatura) return;
    if (!tipoId) {
      toast.error("Selecione o tipo de movimentação para registrar o pagamento.");
      return;
    }
    if (!valorPagamento || valorPagamento <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    if (valorPagamento > restante + 0.005) {
      toast.error(`O valor não pode ser maior que o restante (${formatCurrency(restante)}).`);
      return;
    }
    startTransition(async () => {
      const result = await pagarFaturaAction(cartao.id, fatura.mesRef, valorPagamento, tipoId);
      if (result.success) {
        toast.success(
          valorPagamento >= restante - 0.005
            ? "Fatura paga com sucesso."
            : `Abatimento de ${formatCurrency(valorPagamento)} registrado.`,
          { description: "Movimentação criada em Movimentações." }
        );
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
        toast.success("Último pagamento desfeito.");
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

  const podePagar = fatura && !fatura.paga && fatura.total > 0 && fatura.status !== "futura";

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 p-0 sm:max-w-lg" showCloseButton={!isPending}>
        <DialogHeader className="shrink-0 border-b px-5 pt-5 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="size-5" style={{ color: cartao.cor }} />
            Faturas — {cartao.nome}
          </DialogTitle>
        </DialogHeader>

        {fatura ? (
          <>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
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
                  {!fatura.paga && fatura.status !== "futura" && ` · vence ${formatDate(fatura.vencimento)}`}
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
              {fatura.totalPago > 0 && !fatura.paga && (
                <div className="mt-1 flex items-center justify-center gap-3 text-xs">
                  <span className="text-violet-600 dark:text-violet-400">
                    Pago: {formatCurrency(fatura.totalPago)}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium text-foreground">
                    Restante: {formatCurrency(restante)}
                  </span>
                </div>
              )}
            </div>

            {/* Resumo por responsável — só aparece se houver itens de terceiros */}
            {fatura.itens.some((i) => i.responsavel) && (() => {
              const porPessoa = new Map<string, number>();
              for (const item of fatura.itens) {
                const key = item.responsavel ?? "Você";
                porPessoa.set(key, (porPessoa.get(key) ?? 0) + item.valorParcela);
              }
              const entries = [...porPessoa.entries()].sort(([a], [b]) =>
                a === "Você" ? -1 : b === "Você" ? 1 : a.localeCompare(b)
              );
              const totalTerceiros = entries
                .filter(([k]) => k !== "Você")
                .reduce((acc, [, v]) => acc + v, 0);
              return (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Users className="size-3.5" />
                    Divisão por responsável
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {entries.map(([nome, valor]) => (
                      <div key={nome} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "flex size-5 items-center justify-center rounded-full",
                            nome === "Você"
                              ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          )}>
                            <User className="size-3" />
                          </div>
                          <span className="text-sm font-medium">{nome}</span>
                        </div>
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          nome === "Você"
                            ? "text-foreground"
                            : "text-amber-600 dark:text-amber-400"
                        )}>
                          {formatCurrency(valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {totalTerceiros > 0 && (
                    <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                      A receber de terceiros:{" "}
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {formatCurrency(totalTerceiros)}
                      </span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Itens */}
            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              <div className="divide-y divide-border">
                {fatura.itens.map((item, idx) => (
                  <div key={`${item.compraId}-${idx}`} className="group flex items-center gap-3 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                        {item.recorrente && (
                          <RefreshCw className="size-3 shrink-0 text-violet-500" />
                        )}
                        {item.descricao}
                        {!item.recorrente && item.totalParcelas > 1 && (
                          <span className="text-xs font-normal text-muted-foreground">
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
                        {item.recorrente ? "assinatura mensal" : `compra em ${formatDate(item.dataCompra)}`}
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
            {podePagar && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FloatingInput
                      label="Valor a pagar (R$)"
                      id="valorPagamento"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={restante}
                      value={valorPagamento || ""}
                      onChange={(e) => setValorPagamento(Number(e.target.value) || 0)}
                      disabled={isPending}
                    />
                    {fatura.totalPago === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(fatura.total)}
                      </p>
                    )}
                  </div>
                  <FloatingCombobox
                    label="Tipo de movimentação"
                    options={tiposSaida.map((t) => ({ value: String(t.id), label: t.nome }))}
                    value={tipoId ? String(tipoId) : ""}
                    onChange={(v) => setTipoId(v ? Number(v) : 0)}
                    disabled={isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao registrar, uma movimentação de saída é criada automaticamente.
                  {restante < fatura.total && ` Restante: ${formatCurrency(restante)}`}
                </p>
              </div>
            )}

          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-b-2xl px-5 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Fechar
            </Button>
            {fatura.totalPago > 0 && (
              <Button variant="outline" onClick={handleDesfazer} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Undo2 className="size-4" />
                )}
                Desfazer último pagamento
              </Button>
            )}
            {podePagar && (
              <Button onClick={handlePagar} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    {valorPagamento >= restante - 0.005
                      ? `Pagar ${formatCurrency(valorPagamento || restante)}`
                      : `Abater ${formatCurrency(valorPagamento || 0)}`}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma fatura para exibir.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
