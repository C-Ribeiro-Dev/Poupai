import "server-only";
import { prisma } from "@/lib/prisma";

export type RelatorioPeriodo = "mensal" | "trimestral" | "anual";

export const RELATORIO_MESES: Record<RelatorioPeriodo, number> = {
  mensal: 1,
  trimestral: 3,
  anual: 12,
};

export const RELATORIO_LABELS: Record<RelatorioPeriodo, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

export function parseRelatorioPeriodo(v?: string): RelatorioPeriodo {
  return v === "trimestral" || v === "anual" ? v : "mensal";
}

export interface RelatorioLinhaMes {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface RelatorioLinhaCategoria {
  categoria: string;
  valor: number;
  percentual: number;
}

export interface RelatorioLinhaConta {
  conta: string;
  entradas: number;
  saidas: number;
}

export interface RelatorioData {
  periodo: RelatorioPeriodo;
  labelPeriodo: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  fluxoMensal: RelatorioLinhaMes[];
  despesasPorCategoria: RelatorioLinhaCategoria[];
  receitasPorCategoria: RelatorioLinhaCategoria[];
  porConta: RelatorioLinhaConta[];
  comprasPorCartao: { cartao: string; total: number }[];
}

export async function getRelatorio(
  userId: string,
  periodo: RelatorioPeriodo
): Promise<RelatorioData> {
  const qtd = RELATORIO_MESES[periodo];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (qtd - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [movs, compras] = await Promise.all([
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: start, lt: end } },
      select: {
        valor: true,
        isEntrada: true,
        data: true,
        categoria: true,
        conta: { select: { nome: true } },
      },
    }),
    prisma.compraCartao.findMany({
      where: { userId, isDeleted: false, dataCompra: { gte: start, lt: end } },
      select: { valorTotal: true, cartao: { select: { nome: true } } },
    }),
  ]);

  const valor = (v: unknown) => Number(String(v));
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    ...(qtd > 6 ? { year: "2-digit" } : {}),
  });

  // Fluxo mensal
  const fluxoMensal: RelatorioLinhaMes[] = [];
  const idxByKey = new Map<string, number>();
  for (let i = 0; i < qtd; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    idxByKey.set(`${d.getFullYear()}-${d.getMonth()}`, i);
    fluxoMensal.push({
      label: fmt.format(d).replace(".", ""),
      receitas: 0,
      despesas: 0,
      saldo: 0,
    });
  }

  const despCat = new Map<string, number>();
  const recCat = new Map<string, number>();
  const contaMap = new Map<string, { entradas: number; saidas: number }>();
  let totalReceitas = 0;
  let totalDespesas = 0;

  for (const m of movs) {
    const v = valor(m.valor);
    const d = new Date(m.data);
    const idx = idxByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) {
      if (m.isEntrada) fluxoMensal[idx].receitas += v;
      else fluxoMensal[idx].despesas += v;
    }
    const cat = m.categoria || "Sem categoria";
    if (m.isEntrada) {
      totalReceitas += v;
      recCat.set(cat, (recCat.get(cat) ?? 0) + v);
    } else {
      totalDespesas += v;
      despCat.set(cat, (despCat.get(cat) ?? 0) + v);
    }
    const contaNome = m.conta?.nome ?? "Sem conta";
    const entry = contaMap.get(contaNome) ?? { entradas: 0, saidas: 0 };
    if (m.isEntrada) entry.entradas += v;
    else entry.saidas += v;
    contaMap.set(contaNome, entry);
  }
  for (const linha of fluxoMensal) linha.saldo = linha.receitas - linha.despesas;

  const toLinhas = (map: Map<string, number>, total: number): RelatorioLinhaCategoria[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, v]) => ({
        categoria,
        valor: v,
        percentual: total > 0 ? (v / total) * 100 : 0,
      }));

  const cartaoMap = new Map<string, number>();
  for (const c of compras) {
    cartaoMap.set(c.cartao.nome, (cartaoMap.get(c.cartao.nome) ?? 0) + valor(c.valorTotal));
  }

  const labelPeriodo =
    periodo === "mensal"
      ? new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(now)
      : periodo === "trimestral"
        ? "últimos 3 meses"
        : "últimos 12 meses";

  return {
    periodo,
    labelPeriodo,
    totalReceitas,
    totalDespesas,
    saldo: totalReceitas - totalDespesas,
    fluxoMensal,
    despesasPorCategoria: toLinhas(despCat, totalDespesas),
    receitasPorCategoria: toLinhas(recCat, totalReceitas),
    porConta: [...contaMap.entries()]
      .sort((a, b) => b[1].saidas + b[1].entradas - (a[1].saidas + a[1].entradas))
      .map(([conta, v]) => ({ conta, ...v })),
    comprasPorCartao: [...cartaoMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cartao, total]) => ({ cartao, total })),
  };
}
