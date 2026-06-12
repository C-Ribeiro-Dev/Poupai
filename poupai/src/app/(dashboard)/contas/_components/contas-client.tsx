"use client";
import { useState } from "react";
import {
  Plus,
  Landmark,
  Wallet,
  PiggyBank,
  CircleDollarSign,
  Pencil,
  Trash2,
  ArrowLeftRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { getTipoContaLabel, type ContaRow, type TipoConta } from "@/types/contas";
import type { ContasData } from "@/services/contas";
import { ContaFormDialog } from "./conta-form-dialog";
import { DeleteContaDialog } from "./delete-conta-dialog";
import { TransferenciaDialog } from "./transferencia-dialog";

const tipoIcon: Record<TipoConta, React.ElementType> = {
  corrente: Landmark,
  poupanca: PiggyBank,
  carteira: Wallet,
  outros: CircleDollarSign,
};

interface ContasClientProps {
  data: ContasData;
}

export function ContasClient({ data }: ContasClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editItem, setEditItem] = useState<ContaRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContaRow | null>(null);

  const { contas, saldoConsolidado, transferenciasRecentes } = data;
  const ativas = contas.filter((c) => c.ativo);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Contas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {contas.length > 0 ? (
              <>
                Saldo consolidado:{" "}
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    saldoConsolidado >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {formatCurrency(saldoConsolidado)}
                </span>
              </>
            ) : (
              "Bancos, poupança e carteiras"
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {ativas.length >= 2 && (
            <Button onClick={() => setTransferOpen(true)} size="sm" variant="outline">
              <ArrowLeftRight className="size-4" />
              <span className="hidden sm:inline">Transferir</span>
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Nova conta</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {contas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Landmark className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium">Nenhuma conta cadastrada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre suas contas bancárias e carteiras para acompanhar o saldo de cada uma e
              fazer transferências.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
            <Plus className="size-4" />
            Criar primeira conta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map((c) => {
            const Icon = tipoIcon[c.tipo] ?? CircleDollarSign;
            return (
              <div
                key={c.id}
                className={cn(
                  "group overflow-hidden rounded-xl border border-border bg-card",
                  !c.ativo && "opacity-60"
                )}
              >
                {/* Barra colorida no topo */}
                <div className="h-1.5 w-full" style={{ backgroundColor: c.cor }} />
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${c.cor}22` }}
                    >
                      <Icon className="size-4.5" style={{ color: c.cor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getTipoContaLabel(c.tipo)}
                        {c.instituicao && ` · ${c.instituicao}`}
                        {!c.ativo && " · Inativa"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditItem(c)}
                        aria-label={`Editar conta ${c.nome}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteItem(c)}
                        aria-label={`Excluir conta ${c.nome}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "mt-4 text-2xl font-bold tabular-nums",
                      c.saldoAtual >= 0 ? "text-foreground" : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatCurrency(c.saldoAtual)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">saldo atual</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transferências recentes */}
      {transferenciasRecentes.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Transferências recentes</h2>
          </div>
          <div className="divide-y divide-border">
            {transferenciasRecentes.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <ArrowLeftRight className="size-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {t.deContaNome}
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    {t.paraContaNome}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.descricao ? `${t.descricao} · ` : ""}
                    {formatDate(t.data)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCurrency(t.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ContaFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ContaFormDialog
        open={!!editItem}
        onOpenChange={(o) => {
          if (!o) setEditItem(null);
        }}
        conta={editItem}
      />
      <DeleteContaDialog
        open={!!deleteItem}
        onOpenChange={(o) => {
          if (!o) setDeleteItem(null);
        }}
        conta={deleteItem}
      />
      <TransferenciaDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        contas={ativas}
      />
    </div>
  );
}
