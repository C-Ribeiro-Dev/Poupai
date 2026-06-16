"use client";
import { useState, useMemo } from "react";
import { Calculator, ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/floating-input";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

type Modo = "price" | "sac" | "simples";

interface Parcela {
  n: number;
  amort: number;
  juros: number;
  total: number;
  saldo: number;
}

function calcPrice(pv: number, taxa: number, n: number): Parcela[] {
  if (taxa === 0) return calcSimples(pv, n);
  const r = taxa / 100;
  const pmt = (pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const rows: Parcela[] = [];
  let saldo = pv;
  for (let i = 1; i <= n; i++) {
    const juros = saldo * r;
    const amort = pmt - juros;
    saldo = Math.max(0, saldo - amort);
    rows.push({ n: i, amort, juros, total: pmt, saldo });
  }
  return rows;
}

function calcSAC(pv: number, taxa: number, n: number): Parcela[] {
  if (taxa === 0) return calcSimples(pv, n);
  const r = taxa / 100;
  const amort = pv / n;
  const rows: Parcela[] = [];
  let saldo = pv;
  for (let i = 1; i <= n; i++) {
    const juros = saldo * r;
    saldo = Math.max(0, saldo - amort);
    rows.push({ n: i, amort, juros, total: amort + juros, saldo });
  }
  return rows;
}

function calcSimples(pv: number, n: number): Parcela[] {
  const pmt = pv / n;
  const rows: Parcela[] = [];
  let saldo = pv;
  for (let i = 1; i <= n; i++) {
    saldo = Math.max(0, saldo - pmt);
    rows.push({ n: i, amort: pmt, juros: 0, total: pmt, saldo });
  }
  return rows;
}

export function SimuladorClient() {
  const [valor, setValor] = useState("1000");
  const [taxa, setTaxa] = useState("1");
  const [parcelas, setParcelas] = useState("12");
  const [modo, setModo] = useState<Modo>("price");
  const [showAll, setShowAll] = useState(false);

  const pv = Math.max(0, parseFloat(valor.replace(",", ".")) || 0);
  const r = Math.max(0, parseFloat(taxa.replace(",", ".")) || 0);
  const n = Math.max(1, Math.min(600, parseInt(parcelas) || 1));

  const rows = useMemo(() => {
    if (pv === 0) return [];
    if (modo === "price") return calcPrice(pv, r, n);
    if (modo === "sac") return calcSAC(pv, r, n);
    return calcSimples(pv, n);
  }, [pv, r, n, modo]);

  const totalPago = rows.reduce((s, p) => s + p.total, 0);
  const totalJuros = rows.reduce((s, p) => s + p.juros, 0);
  const primeiraParcela = rows[0]?.total ?? 0;
  const ultimaParcela = rows[rows.length - 1]?.total ?? 0;

  const visibleRows = showAll ? rows : rows.slice(0, 6);

  const modos: { value: Modo; label: string; desc: string }[] = [
    { value: "price", label: "Price", desc: "Parcela fixa, juros maiores no início" },
    { value: "sac", label: "SAC", desc: "Amortização fixa, parcelas decrescentes" },
    { value: "simples", label: "Sem juros", desc: "Divisão simples sem juros" },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Calculator className="size-5 text-blue-500" />
          Simulador de compra
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Calcule o custo real de uma compra parcelada ou financiamento.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FloatingInput
          label="Valor (R$)"
          id="valor"
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        <FloatingInput
          label="Taxa de juros mensal (%)"
          id="taxa"
          type="number"
          min="0"
          step="0.01"
          value={taxa}
          onChange={(e) => setTaxa(e.target.value)}
        />
        <FloatingInput
          label="Número de parcelas"
          id="parcelas"
          type="number"
          min="1"
          max="600"
          value={parcelas}
          onChange={(e) => setParcelas(e.target.value)}
        />
      </div>

      {/* Modo */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Modalidade</p>
        <div className="flex flex-wrap gap-2">
          {modos.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setModo(m.value)}
              className={cn(
                "flex flex-col gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-colors",
                modo === m.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/40"
              )}
            >
              <span className="text-sm font-semibold">{m.label}</span>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">1ª parcela</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums">{fmt(primeiraParcela)}</p>
            </div>
            {modo === "sac" && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Última parcela</p>
                <p className="mt-1.5 text-lg font-bold tabular-nums">{fmt(ultimaParcela)}</p>
              </div>
            )}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total pago</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums">{fmt(totalPago)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Total em juros</p>
              <p className={cn("mt-1.5 text-lg font-bold tabular-nums", totalJuros > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
                {fmt(totalJuros)}
              </p>
            </div>
            {totalJuros > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Custo real</p>
                <p className="mt-1.5 text-lg font-bold tabular-nums text-red-600 dark:text-red-400">
                  +{((totalJuros / pv) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Tabela */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Parcela</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amortização</th>
                    {modo !== "simples" && (
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Juros</th>
                    )}
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Saldo devedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleRows.map((p) => (
                    <tr key={p.n} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 text-muted-foreground">{p.n}ª</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmt(p.amort)}</td>
                      {modo !== "simples" && (
                        <td className={cn("px-4 py-2.5 text-right tabular-nums", p.juros > 0 && "text-red-600 dark:text-red-400")}>
                          {fmt(p.juros)}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{fmt(p.total)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{fmt(p.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 6 && (
              <div className="border-t border-border bg-muted/20 px-4 py-2.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="h-7 text-xs"
                >
                  {showAll ? (
                    <><ArrowUp className="size-3" />Mostrar menos</>
                  ) : (
                    <><ArrowDown className="size-3" />Ver todas as {rows.length} parcelas</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
