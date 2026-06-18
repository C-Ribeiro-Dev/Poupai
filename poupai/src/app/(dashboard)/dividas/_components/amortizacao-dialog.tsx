"use client";
import { useState, useMemo, useEffect } from "react";
import { Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DividaRow } from "@/types/dividas";

type Metodo = "price" | "sac";

interface Parcela {
  mes: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldo: number;
}

function calcPrice(saldo: number, i: number, n: number): Parcela[] {
  const rows: Parcela[] = [];
  const P =
    i === 0
      ? saldo / n
      : (saldo * (i * Math.pow(1 + i, n))) / (Math.pow(1 + i, n) - 1);
  let sd = saldo;
  for (let m = 1; m <= n; m++) {
    const juros = sd * i;
    const amort = P - juros;
    sd = Math.max(0, sd - amort);
    rows.push({ mes: m, parcela: P, juros, amortizacao: amort, saldo: sd });
  }
  return rows;
}

function calcSAC(saldo: number, i: number, n: number): Parcela[] {
  const rows: Parcela[] = [];
  const amortBase = saldo / n;
  let sd = saldo;
  for (let m = 1; m <= n; m++) {
    const juros = sd * i;
    const amort = Math.min(amortBase, sd);
    sd = Math.max(0, sd - amort);
    rows.push({ mes: m, parcela: amort + juros, juros, amortizacao: amort, saldo: sd });
  }
  return rows;
}

interface Props {
  divida: DividaRow | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AmortizacaoDialog({ divida, open, onOpenChange }: Props) {
  const [metodo, setMetodo] = useState<Metodo>("price");
  const [saldo, setSaldo] = useState("0");
  const [taxa, setTaxa] = useState("0");
  const [n, setN] = useState("12");

  useEffect(() => {
    if (open && divida) {
      setSaldo(divida.saldoDevedor.toFixed(2));
      setTaxa(divida.taxaJurosMensal.toFixed(4));
      setN(String(Math.max(1, divida.nParcelas - divida.parcelasPagas)));
      setMetodo("price");
    }
  }, [open, divida?.id]);

  const parcelas = useMemo<Parcela[]>(() => {
    const sd = parseFloat(saldo) || 0;
    const i = (parseFloat(taxa) || 0) / 100;
    const nm = Math.min(Math.max(parseInt(n, 10) || 0, 0), 600);
    if (sd <= 0 || nm <= 0) return [];
    return metodo === "price" ? calcPrice(sd, i, nm) : calcSAC(sd, i, nm);
  }, [saldo, taxa, n, metodo]);

  const totalPago = parcelas.reduce((s, p) => s + p.parcela, 0);
  const totalJuros = parcelas.reduce((s, p) => s + p.juros, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-4" />
            Simulador de amortização
            {divida && (
              <span className="font-normal text-muted-foreground">· {divida.credor}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">Saldo devedor (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Taxa mensal (%)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={taxa}
                onChange={(e) => setTaxa(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Parcelas restantes</label>
              <input
                type="number"
                min={1}
                max={600}
                step={1}
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Método */}
          <div className="flex gap-2">
            {(["price", "sac"] as Metodo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetodo(m)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  metodo === m
                    ? "bg-foreground text-background"
                    : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {m === "price" ? "Price (parcela fixa)" : "SAC (amortização fixa)"}
              </button>
            ))}
          </div>

          {parcelas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Preencha os campos para calcular o cronograma.
            </p>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground">Total a pagar</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums">
                    {formatCurrency(totalPago)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground">Total de juros</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                    {formatCurrency(totalJuros)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] text-muted-foreground">
                    {metodo === "price" ? "Parcela fixa" : "1ª parcela"}
                  </p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums">
                    {formatCurrency(parcelas[0].parcela)}
                  </p>
                </div>
              </div>

              {/* Tabela */}
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 border-b border-border bg-muted/80">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mês</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Parcela</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Juros</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amortização</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parcelas.map((p) => (
                        <tr key={p.mes} className="hover:bg-muted/30">
                          <td className="px-3 py-1.5 font-medium">{p.mes}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {formatCurrency(p.parcela)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-red-600 dark:text-red-400">
                            {formatCurrency(p.juros)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(p.amortizacao)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                            {formatCurrency(p.saldo)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
