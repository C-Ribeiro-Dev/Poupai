import Link from "next/link";
import { CreditCard, Wallet, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { CartaoVsDinheiroData } from "@/services/cartao-vs-dinheiro";

interface CartaoVsDinheiroCardProps {
  data: CartaoVsDinheiroData;
}

export function CartaoVsDinheiroCard({ data }: CartaoVsDinheiroCardProps) {
  const { totalCartao, totalDinheiro, percentCartao, percentDinheiro, mes } = data;
  const total = totalCartao + totalDinheiro;

  if (total === 0) return null;

  const cartaoAlto = percentCartao > 60;
  const cartaoBom = percentCartao < 30;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Cartão vs Dinheiro/PIX</h2>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">{mes}</p>
        </div>
        <Link
          href="/movimentacoes"
          className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Ver movimentações
        </Link>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {/* Barra de progresso */}
        <div className="flex h-3 overflow-hidden rounded-full bg-muted">
          {percentCartao > 0 && (
            <div
              className={cn(
                "h-full transition-all",
                cartaoBom ? "bg-emerald-500" : cartaoAlto ? "bg-red-500" : "bg-amber-500"
              )}
              style={{ width: `${percentCartao}%` }}
            />
          )}
          {percentDinheiro > 0 && (
            <div
              className="h-full bg-indigo-500"
              style={{ width: `${percentDinheiro}%` }}
            />
          )}
        </div>

        {/* Legenda */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
            <div className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              cartaoBom ? "bg-emerald-500/10" : cartaoAlto ? "bg-red-500/10" : "bg-amber-500/10"
            )}>
              <CreditCard className={cn(
                "size-4",
                cartaoBom ? "text-emerald-500" : cartaoAlto ? "text-red-500" : "text-amber-500"
              )} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Cartão</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(totalCartao)}</p>
              <p className={cn(
                "text-xs font-medium tabular-nums",
                cartaoBom ? "text-emerald-600 dark:text-emerald-400" : cartaoAlto ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              )}>
                {percentCartao.toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Wallet className="size-4 text-indigo-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Dinheiro/PIX</p>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(totalDinheiro)}</p>
              <p className="text-xs font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
                {percentDinheiro.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de incentivo */}
        {cartaoAlto && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/8 px-3 py-2.5">
            <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-red-500" />
            <p className="text-xs text-red-700 dark:text-red-400">
              {percentCartao.toFixed(0)}% dos gastos no cartão este mês. Use o PIX para reduzir.
            </p>
          </div>
        )}
        {cartaoBom && totalCartao > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-emerald-500/8 px-3 py-2.5">
            <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-emerald-500 rotate-180" />
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Ótimo! Apenas {percentCartao.toFixed(0)}% no cartão este mês.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
