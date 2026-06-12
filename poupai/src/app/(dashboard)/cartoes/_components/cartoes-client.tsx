"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, CreditCard, Pencil, Trash2, Receipt, ShoppingCart, ArrowRightLeft, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import type { CartaoRow } from "@/types/cartoes";
import type { TipoMovimentacaoRow } from "@/types/tipos";
import type { CategoriaRow } from "@/types/categorias";
import { mesRefLabel } from "@/lib/cartao-fatura";
import { CartaoFormDialog } from "./cartao-form-dialog";
import { DeleteCartaoDialog } from "./delete-cartao-dialog";
import { CompraFormDialog } from "./compra-form-dialog";
import { FaturasDialog } from "./faturas-dialog";
import { MigrarCartaoDialog } from "./migrar-cartao-dialog";

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

interface CartoesClientProps {
  cartoes: CartaoRow[];
  tipos: TipoMovimentacaoRow[];
  categorias: CategoriaRow[];
}

export function CartoesClient({ cartoes, tipos, categorias }: CartoesClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<CartaoRow | null>(null);
  const [deleteItem, setDeleteItem] = useState<CartaoRow | null>(null);
  const [compraItem, setCompraItem] = useState<CartaoRow | null>(null);
  const [faturasItem, setFaturasItem] = useState<CartaoRow | null>(null);
  const [migrarOpen, setMigrarOpen] = useState(false);

  const totalFaturasAbertas = cartoes.reduce(
    (acc, c) => acc + (c.faturaAtual && !c.faturaAtual.paga ? c.faturaAtual.total : 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cartões</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cartoes.length > 0
              ? `Faturas em aberto: ${formatCurrency(totalFaturasAbertas)}`
              : "Controle de cartões de crédito e faturas"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {cartoes.length > 0 && (
            <Button variant="outline" onClick={() => setMigrarOpen(true)} size="sm">
              <ArrowRightLeft className="size-4" />
              <span className="hidden sm:inline">Migrar do extrato</span>
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Novo cartão</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {cartoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
          </div>
          <div className="max-w-sm">
            <p className="font-medium">Nenhum cartão cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre seus cartões de crédito para controlar compras, parcelas, faturas e
              limite disponível.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" variant="outline">
            <Plus className="size-4" />
            Cadastrar cartão
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cartoes.map((c) => {
            const pctUso = c.limite > 0 ? (c.usado / c.limite) * 100 : 0;
            return (
              <div key={c.id} className="group rounded-xl border border-border bg-card p-5">
                {/* Header do cartão */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${c.cor}22` }}
                  >
                    <CreditCard className="size-5" style={{ color: c.cor }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.bandeira ? `${c.bandeira} · ` : ""}
                      Fecha dia {c.diaFechamento} · vence dia {c.diaVencimento}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 transition-opacity md:opacity-0 md:focus-within:opacity-100 md:group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditItem(c)}
                      aria-label={`Editar cartão ${c.nome}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteItem(c)}
                      aria-label={`Excluir cartão ${c.nome}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Limite */}
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pctUso >= 90 ? "bg-red-500" : pctUso >= 70 ? "bg-amber-400" : "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(pctUso, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="tabular-nums text-muted-foreground">
                    Usado: <span className="font-medium text-foreground">{formatCurrency(c.usado)}</span>
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-medium",
                      c.disponivel < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {formatCurrency(c.disponivel)} disponível
                  </span>
                </div>

                {/* Fatura atual */}
                {c.faturaAtual ? (
                  <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          Fatura {mesRefLabel(c.faturaAtual.mesRef)}
                        </p>
                        <p className="text-lg font-bold tabular-nums">
                          {formatCurrency(c.faturaAtual.total)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                          statusBadge[c.faturaAtual.status]
                        )}
                      >
                        {statusLabel[c.faturaAtual.status]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-center text-xs text-muted-foreground">
                    Nenhuma compra lançada ainda.
                  </p>
                )}

                {/* Ações */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCompraItem(c)}>
                    <ShoppingCart className="size-4" />
                    <span className="hidden sm:inline">Nova compra</span>
                    <span className="sm:hidden">Compra</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFaturasItem(c)}
                    disabled={c.faturas.length === 0}
                  >
                    <Receipt className="size-4" />
                    <span className="hidden sm:inline">Ver faturas</span>
                    <span className="sm:hidden">Faturas</span>
                  </Button>
                  <Link
                    href={`/movimentacoes/importar?cartao=${c.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Upload className="size-4" />
                    <span className="hidden sm:inline">Importar</span>
                    <span className="sm:hidden">CSV</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CartaoFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <CartaoFormDialog
        open={!!editItem}
        onOpenChange={(o) => {
          if (!o) setEditItem(null);
        }}
        cartao={editItem}
      />
      <DeleteCartaoDialog
        open={!!deleteItem}
        onOpenChange={(o) => {
          if (!o) setDeleteItem(null);
        }}
        cartao={deleteItem}
      />
      <CompraFormDialog
        open={!!compraItem}
        onOpenChange={(o) => {
          if (!o) setCompraItem(null);
        }}
        cartao={compraItem}
        categorias={categorias}
      />
      <FaturasDialog
        open={!!faturasItem}
        onOpenChange={(o) => {
          if (!o) setFaturasItem(null);
        }}
        cartao={faturasItem}
        tipos={tipos}
      />
      <MigrarCartaoDialog
        open={migrarOpen}
        onOpenChange={setMigrarOpen}
        cartoes={cartoes}
      />
    </div>
  );
}
