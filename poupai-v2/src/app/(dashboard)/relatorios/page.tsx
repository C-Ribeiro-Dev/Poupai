import type { Metadata } from "next";
import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { getCurrentUserId } from "@/lib/auth";
import {
  getRelatorio,
  parseRelatorioPeriodo,
  RELATORIO_LABELS,
  type RelatorioPeriodo,
  type RelatorioLinhaCategoria,
} from "@/services/relatorios";

export const metadata: Metadata = { title: "Relatórios" };

const periodos: RelatorioPeriodo[] = ["mensal", "trimestral", "anual"];

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const userId = await getCurrentUserId();
  const { p } = await searchParams;
  const periodo = parseRelatorioPeriodo(p);
  const data = await getRelatorio(userId, periodo);

  const temDados = data.totalReceitas > 0 || data.totalDespesas > 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Relatórios</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Resumo financeiro · {data.labelPeriodo}
          </p>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {periodos.map((per) => (
            <Link
              key={per}
              href={per === "mensal" ? "/relatorios" : `/relatorios?p=${per}`}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                periodo === per
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {RELATORIO_LABELS[per]}
            </Link>
          ))}
        </div>
      </div>

      {!temDados ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <FileBarChart className="size-9 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">
            Sem movimentações no período
          </p>
          <p className="text-xs text-muted-foreground">
            Registre receitas e despesas para gerar o relatório.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <ResumoCard label="Receitas" valor={data.totalReceitas} tom="positivo" />
            <ResumoCard label="Despesas" valor={data.totalDespesas} tom="negativo" />
            <ResumoCard
              label="Saldo"
              valor={data.saldo}
              tom={data.saldo >= 0 ? "positivo" : "negativo"}
            />
          </div>

          {/* Fluxo de caixa */}
          {data.fluxoMensal.length > 1 && (
            <TabelaCard titulo="Fluxo de caixa" subtitulo="Mês a mês no período">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-left font-medium">Mês</th>
                    <th className="px-4 py-2 text-right font-medium">Receitas</th>
                    <th className="px-4 py-2 text-right font-medium">Despesas</th>
                    <th className="px-4 py-2 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.fluxoMensal.map((m, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 capitalize">{m.label}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(m.receitas)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400">
                        {formatCurrency(m.despesas)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right font-semibold tabular-nums",
                          m.saldo >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {formatCurrency(m.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelaCard>
          )}

          {/* Categorias */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CategoriaTabela
              titulo="Despesas por categoria"
              linhas={data.despesasPorCategoria}
              corClasse="text-red-600 dark:text-red-400"
            />
            <CategoriaTabela
              titulo="Receitas por categoria"
              linhas={data.receitasPorCategoria}
              corClasse="text-emerald-600 dark:text-emerald-400"
            />
          </div>

          {/* Por conta e cartão */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.porConta.length > 0 && (
              <TabelaCard titulo="Por conta" subtitulo="Entradas e saídas no período">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {data.porConta.map((c) => (
                      <tr key={c.conta}>
                        <td className="px-4 py-2.5 font-medium">{c.conta}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(c.entradas)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400">
                          −{formatCurrency(c.saidas)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabelaCard>
            )}
            {data.comprasPorCartao.length > 0 && (
              <TabelaCard titulo="Compras por cartão" subtitulo="Total comprado no período">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {data.comprasPorCartao.map((c) => (
                      <tr key={c.cartao}>
                        <td className="px-4 py-2.5 font-medium">{c.cartao}</td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                          {formatCurrency(c.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabelaCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ResumoCard({
  label,
  valor,
  tom,
}: {
  label: string;
  valor: number;
  tom: "positivo" | "negativo";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-lg font-bold tabular-nums sm:text-2xl",
          tom === "positivo"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        {formatCurrency(valor)}
      </p>
    </div>
  );
}

function TabelaCard({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3.5">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function CategoriaTabela({
  titulo,
  linhas,
  corClasse,
}: {
  titulo: string;
  linhas: RelatorioLinhaCategoria[];
  corClasse: string;
}) {
  return (
    <TabelaCard titulo={titulo}>
      {linhas.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">
          Sem dados no período.
        </p>
      ) : (
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {linhas.map((l) => (
              <tr key={l.categoria}>
                <td className="px-4 py-2.5">{l.categoria}</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums text-muted-foreground">
                  {l.percentual.toFixed(1)}%
                </td>
                <td className={cn("px-4 py-2.5 text-right font-semibold tabular-nums", corClasse)}>
                  {formatCurrency(l.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TabelaCard>
  );
}
