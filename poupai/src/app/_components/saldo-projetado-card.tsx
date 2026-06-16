"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaldoProjetadoData } from "@/types/saldo-projetado";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function SaldoProjetadoCard({ data }: { data: SaldoProjetadoData }) {
  const variacao = data.saldoFimMes - data.saldoAtual;
  const tendencia = variacao > 0 ? "positiva" : variacao < 0 ? "negativa" : "neutra";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        data.temSaldoNegativo
          ? "border-destructive/40"
          : tendencia === "positiva"
            ? "border-emerald-500/30"
            : "border-amber-500/30"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Saldo Projetado</span>
        </div>
        <Link
          href="/saldo-projetado"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Ver linha do tempo
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Alerta saldo negativo */}
      {data.temSaldoNegativo && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Saldo negativo previsto nos próximos 90 dias</span>
        </div>
      )}

      {/* Valores principais */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Hoje</p>
          <p className="text-xl font-bold text-foreground">{fmt(data.saldoAtual)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Fim do mês</p>
          <p
            className={cn(
              "text-xl font-bold",
              data.saldoFimMes < 0
                ? "text-destructive"
                : tendencia === "positiva"
                  ? "text-emerald-600"
                  : "text-amber-600"
            )}
          >
            {fmt(data.saldoFimMes)}
          </p>
        </div>
      </div>

      {/* Variação */}
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {tendencia === "positiva" ? (
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
        ) : tendencia === "negativa" ? (
          <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span
          className={cn(
            tendencia === "positiva"
              ? "text-emerald-600"
              : tendencia === "negativa"
                ? "text-amber-600"
                : "text-muted-foreground"
          )}
        >
          {variacao >= 0 ? "+" : ""}
          {fmt(variacao)} até o fim do mês
        </span>
      </div>

      {/* Maior / Menor */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Maior previsto</p>
          <p className="text-sm font-semibold text-emerald-600">{fmt(data.maiorSaldo.valor)}</p>
          {data.maiorSaldo.data && (
            <p className="text-[10px] text-muted-foreground">
              {data.maiorSaldo.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </p>
          )}
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Menor previsto</p>
          <p
            className={cn(
              "text-sm font-semibold",
              data.menorSaldo.valor < 0 ? "text-destructive" : "text-amber-600"
            )}
          >
            {fmt(data.menorSaldo.valor)}
          </p>
          {data.menorSaldo.data && (
            <p className="text-[10px] text-muted-foreground">
              {data.menorSaldo.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
