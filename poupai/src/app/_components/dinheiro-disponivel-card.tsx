"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, ChevronRight, X, TrendingUp, TrendingDown, CreditCard, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DinheiroDisponivelData, DinheiroDisponivelDetalhe, DisponibilidadeStatus } from "@/types/dinheiro-disponivel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: Date | null | undefined) => {
  if (!d) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d));
};

const statusConfig: Record<
  DisponibilidadeStatus,
  { label: string; icon: React.ElementType; cardBorder: string; iconBg: string; iconColor: string; valueColor: string; badgeBg: string; badgeText: string }
> = {
  confortavel: {
    label: "Situação confortável",
    icon: ShieldCheck,
    cardBorder: "border-emerald-300 dark:border-emerald-800/60",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    valueColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700 dark:text-emerald-400",
  },
  atencao: {
    label: "Pouca margem disponível",
    icon: AlertTriangle,
    cardBorder: "border-amber-300 dark:border-amber-800/60",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    valueColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700 dark:text-amber-400",
  },
  critico: {
    label: "Despesas comprometem a renda",
    icon: AlertCircle,
    cardBorder: "border-red-300 dark:border-red-800/60",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    valueColor: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-500/10",
    badgeText: "text-red-700 dark:text-red-400",
  },
};

function DetalheSection({
  title,
  icon: Icon,
  iconColor,
  items,
  sinal,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: DinheiroDisponivelDetalhe[];
  sinal: "+" | "−";
}) {
  if (items.length === 0) return null;
  const total = items.reduce((acc, i) => acc + i.valor, 0);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", iconColor)} />
          <span className="text-xs font-semibold text-foreground">{title}</span>
        </div>
        <span className={cn("text-xs font-semibold tabular-nums", iconColor)}>
          {sinal}{fmt(total)}
        </span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-2 pl-5">
          <div className="min-w-0 flex-1">
            <span className="truncate text-xs text-muted-foreground">{item.descricao}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {item.vencimento && (
              <span className="text-[11px] text-muted-foreground/70">
                {fmtDate(item.vencimento)}
              </span>
            )}
            <span className="text-xs tabular-nums text-foreground">{fmt(item.valor)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CalcRow({
  label,
  value,
  color,
  size = "sm",
  border = false,
}: {
  label: string;
  value: string;
  color?: string;
  size?: "sm" | "base";
  border?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", border && "border-t border-border pt-2 mt-1")}>
      <span className={cn("text-muted-foreground", size === "sm" ? "text-xs" : "text-sm font-semibold text-foreground")}>
        {label}
      </span>
      <span className={cn("tabular-nums font-semibold", size === "sm" ? "text-xs text-foreground" : "text-base", color)}>
        {value}
      </span>
    </div>
  );
}

export function DinheiroDisponivelCard({ data }: { data: DinheiroDisponivelData }) {
  const [open, setOpen] = useState(false);
  const cfg = statusConfig[data.status];
  const Icon = cfg.icon;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          cfg.cardBorder
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", cfg.iconBg)}>
              <Icon className={cn("size-4", cfg.iconColor)} />
            </div>
            <span className="text-sm text-muted-foreground">Dinheiro disponível</span>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Valor principal */}
        <p className={cn("mt-3 text-3xl font-bold tabular-nums", cfg.valueColor)}>
          {fmt(data.dinheiroDisponivel)}
        </p>

        {/* Badge de status */}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.badgeBg, cfg.badgeText)}>
            {cfg.label}
          </span>
        </div>

        {/* Linha secundária */}
        <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
          Você pode utilizar este valor sem comprometer suas obrigações financeiras cadastradas.
        </p>

        {/* Métricas rápidas */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Saldo atual</p>
            <p className={cn("text-sm font-semibold tabular-nums", data.saldoAtual >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
              {fmt(data.saldoAtual)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Comprometido</p>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {fmt(data.despesasObrigatorias)}
            </p>
          </div>
          {data.proximoVencimento && (
            <div className="col-span-2 mt-1">
              <p className="text-[11px] text-muted-foreground">Próximo vencimento</p>
              <p className="truncate text-xs font-medium text-foreground">
                {data.proximoVencimento.descricao}{" "}
                <span className="text-muted-foreground">
                  ({fmtDate(data.proximoVencimento.data)}) · {fmt(data.proximoVencimento.valor)}
                </span>
              </p>
            </div>
          )}
        </div>
      </button>

      {/* Dialog de detalhamento */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className={cn("flex size-7 items-center justify-center rounded-lg", cfg.iconBg)}>
                <Icon className={cn("size-4", cfg.iconColor)} />
              </div>
              Como calculamos seu dinheiro disponível
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            {/* Fórmula resumida */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
              <CalcRow label="Saldo atual nas contas" value={fmt(data.saldoAtual)} color="text-emerald-600 dark:text-emerald-400" />
              {data.receitasFuturas > 0 && (
                <CalcRow label="+ Receitas fixas pendentes" value={fmt(data.receitasFuturas)} color="text-emerald-600 dark:text-emerald-400" />
              )}
              <CalcRow label="− Despesas obrigatórias" value={fmt(data.despesasObrigatorias)} color="text-red-600 dark:text-red-400" />
              <CalcRow
                label="= Dinheiro disponível"
                value={fmt(data.dinheiroDisponivel)}
                color={cfg.valueColor}
                size="base"
                border
              />
            </div>

            {/* Detalhamento por categoria */}
            <div className="space-y-4">
              <DetalheSection
                title="Receitas fixas pendentes"
                icon={TrendingUp}
                iconColor="text-emerald-600 dark:text-emerald-400"
                items={data.detalhes.fixasReceita}
                sinal="+"
              />
              <DetalheSection
                title="Despesas fixas pendentes"
                icon={TrendingDown}
                iconColor="text-red-600 dark:text-red-400"
                items={data.detalhes.fixasDespesa}
                sinal="−"
              />
              <DetalheSection
                title="Faturas de cartão pendentes"
                icon={CreditCard}
                iconColor="text-purple-600 dark:text-purple-400"
                items={data.detalhes.faturasCartao}
                sinal="−"
              />
              <DetalheSection
                title="Parcelas de dívidas ativas"
                icon={Receipt}
                iconColor="text-orange-600 dark:text-orange-400"
                items={data.detalhes.dividasParceladas}
                sinal="−"
              />
            </div>

            {/* Aviso de transparência */}
            {data.detalhes.fixasReceita.length === 0 &&
              data.detalhes.fixasDespesa.length === 0 &&
              data.detalhes.faturasCartao.length === 0 &&
              data.detalhes.dividasParceladas.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">
                  Nenhuma obrigação futura encontrada. Cadastre movimentações fixas, cartões ou dívidas para um cálculo mais preciso.
                </p>
              )}

            <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
              O cálculo considera apenas obrigações cadastradas no Poupai. Despesas já pagas não são incluídas. Dívidas parceladas consideradas pelo valor da próxima parcela.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
