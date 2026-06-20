"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CreditCard, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  GastosCartaoCategoriaData,
  CategoriaCartaoItem,
  PeriodoCartao,
} from "@/services/gastos-cartao-categoria";
import { fetchGastosCartaoPorCategoria } from "@/actions/gastos-cartao-categoria";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtCompact = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" });

const BAR_COLORS = [
  "bg-violet-500",
  "bg-indigo-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-emerald-500",
];

const FILTROS: { label: string; value: PeriodoCartao }[] = [
  { label: "Fatura aberta", value: "aberta" },
  { label: "Mês atual", value: "1m" },
  { label: "6 meses", value: "6m" },
  { label: "12 meses", value: "12m" },
];

const PERIODO_SUBLABEL: Record<PeriodoCartao, string> = {
  aberta: "fatura aberta",
  "1m": "este mês",
  "6m": "últimos 6 meses",
  "12m": "últimos 12 meses",
};

function CategoriaRow({
  cat,
  i,
  compact = false,
}: {
  cat: CategoriaCartaoItem;
  i: number;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", BAR_COLORS[i % BAR_COLORS.length])} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{cat.categoria}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{cat.percentual.toFixed(0)}%</span>
            <span className="min-w-16 text-right text-sm font-semibold tabular-nums">
              {compact ? fmtCompact(cat.total) : fmt(cat.total)}
            </span>
          </div>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", BAR_COLORS[i % BAR_COLORS.length])}
            style={{ width: `${cat.percentual}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function GastosCartaoCategoriaCard({ data: initialData }: { data: GastosCartaoCategoriaData }) {
  const [open, setOpen] = useState(false);
  const [modalData, setModalData] = useState(initialData);
  const [isPending, startTransition] = useTransition();

  const { categorias } = initialData;
  const top7 = categorias.slice(0, 7);
  const temMais = categorias.length > 7;

  function handleOpenModal() {
    setModalData(initialData);
    setOpen(true);
  }

  function handlePeriodo(periodo: PeriodoCartao) {
    startTransition(async () => {
      const novo = await fetchGastosCartaoPorCategoria(periodo);
      setModalData(novo);
    });
  }

  return (
    <>
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-indigo-500" />
            <span className="text-sm font-semibold">Gastos no cartão por categoria</span>
          </div>
          {categorias.length > 0 && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Ver detalhes
              <ArrowRight className="size-3" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 p-4">
          {categorias.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma compra no cartão ainda.</p>
              <Link href="/cartoes" className="mt-1 text-xs text-primary underline-offset-2 hover:underline">
                Registrar compra
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold tabular-nums">{fmt(initialData.totalGeral)}</p>
                <span className="text-xs text-muted-foreground">fatura aberta</span>
              </div>

              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                {top7.map((cat, i) => (
                  <div
                    key={cat.categoria}
                    className={cn("h-full transition-all", BAR_COLORS[i % BAR_COLORS.length])}
                    style={{ width: `${cat.percentual}%` }}
                    title={`${cat.categoria}: ${cat.percentual.toFixed(1)}%`}
                  />
                ))}
              </div>

              <div className="space-y-2.5">
                {top7.map((cat, i) => (
                  <CategoriaRow key={cat.categoria} cat={cat} i={i} compact />
                ))}
              </div>

              {temMais && (
                <button
                  onClick={handleOpenModal}
                  className="text-left text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
                >
                  +{categorias.length - 7} categorias · ver todas
                </button>
              )}

              {categorias[0] && (
                <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    Maior gasto:{" "}
                    <span className="font-semibold text-foreground">{categorias[0].categoria}</span>
                    {" "}representa{" "}
                    <span className="font-semibold text-foreground">
                      {categorias[0].percentual.toFixed(0)}%
                    </span>
                    {" "}do total de compras no cartão.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 flex w-full max-w-md flex-col rounded-xl border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-indigo-500" />
                <span className="text-sm font-semibold">Gastos por categoria</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-1.5 border-b px-4 py-2.5">
              {FILTROS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handlePeriodo(f.value)}
                  disabled={isPending}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    modalData.periodo === f.value
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-baseline justify-between px-4 pt-4">
              <p className={cn("text-xl font-bold tabular-nums transition-opacity", isPending && "opacity-50")}>
                {fmt(modalData.totalGeral)}
              </p>
              <span className="text-xs text-muted-foreground">
                {PERIODO_SUBLABEL[modalData.periodo]} · {modalData.categorias.length} categorias
              </span>
            </div>

            {/* Lista */}
            <div className={cn("max-h-[55vh] overflow-y-auto px-4 py-3 transition-opacity", isPending && "opacity-50")}>
              {modalData.categorias.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma compra neste período.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {modalData.categorias.map((cat, i) => (
                    <CategoriaRow key={cat.categoria} cat={cat} i={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-3">
              <Link
                href="/cartoes"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-2"
              >
                Ver cartões
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
