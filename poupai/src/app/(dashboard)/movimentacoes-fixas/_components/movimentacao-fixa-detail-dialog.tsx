"use client";
import { CalendarCheck, Coins, Tag, AlignLeft, CreditCard, Calendar, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type MovimentacaoFixaRow,
  getMovimentacaoFixaStatus,
  type MovimentacaoFixaStatus,
} from "@/types/movimentacoes-fixas";

interface MovimentacaoFixaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacaoFixa: MovimentacaoFixaRow | null;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
    new Date(date)
  );

const statusConfig: Record<
  MovimentacaoFixaStatus,
  { label: string; className: string }
> = {
  pago: {
    label: "Pago",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  pendente: {
    label: "Pendente",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  vencido: {
    label: "Vencido",
    className: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  inativo: {
    label: "Inativo",
    className: "bg-foreground/10 text-muted-foreground",
  },
};

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{children}</span>
      </div>
    </div>
  );
}

export function MovimentacaoFixaDetailDialog({
  open,
  onOpenChange,
  movimentacaoFixa: m,
}: MovimentacaoFixaDetailDialogProps) {
  if (!m) return null;

  const status = getMovimentacaoFixaStatus(m);
  const statusCfg = statusConfig[status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {m.nome}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
              m.isEntrada
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-red-500/15 text-red-700 dark:text-red-400"
            )}
          >
            {m.isEntrada ? "Entrada" : "Saída"}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
              statusCfg.className
            )}
          >
            {statusCfg.label}
          </span>
          {!m.ativo && (
            <span className="inline-flex items-center rounded-md bg-foreground/10 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Inativo
            </span>
          )}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">Valor</p>
          <p
            className={cn(
              "mt-1 text-3xl font-bold tabular-nums",
              m.isEntrada
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {formatCurrency(m.valor)}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Field icon={Tag} label="Tipo">
            {m.tipoNome}
          </Field>

          {m.diaVencimento && (
            <Field icon={CalendarCheck} label="Dia de vencimento">
              Todo dia {m.diaVencimento}
            </Field>
          )}

          {m.dataVencimento && (
            <Field icon={Calendar} label="Próximo vencimento">
              {formatDate(m.dataVencimento)}
            </Field>
          )}

          {m.dataFim && (
            <Field icon={Calendar} label="Data fim">
              {formatDate(m.dataFim)}
            </Field>
          )}

          {m.categoria && (
            <Field icon={Tag} label="Categoria">
              {m.categoria}
            </Field>
          )}

          {m.formaPagamento && (
            <Field icon={CreditCard} label="Forma de pagamento">
              {m.formaPagamento}
            </Field>
          )}

          {m.pago && m.dataUltimoPagamento && (
            <Field icon={Coins} label="Último pagamento">
              {formatDate(m.dataUltimoPagamento)}
            </Field>
          )}

          {m.observacoes && (
            <Field icon={AlignLeft} label="Observações">
              <span className="whitespace-pre-wrap">{m.observacoes}</span>
            </Field>
          )}

          <Field icon={Power} label="Status">
            {m.ativo ? "Ativo" : "Inativo"}
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
