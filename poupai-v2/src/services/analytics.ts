import "server-only";
import { prisma } from "@/lib/prisma";
import { isPagoNoCiclo, vencimentoNoCiclo, isEncerrada } from "@/lib/fixas-ciclo";

export type AnalyticsPeriodo = "atual" | "3m" | "6m" | "1a";

export const PERIODO_MESES: Record<AnalyticsPeriodo, number> = {
  atual: 1,
  "3m": 3,
  "6m": 6,
  "1a": 12,
};

export const PERIODO_LABELS: Record<AnalyticsPeriodo, string> = {
  atual: "Mês atual",
  "3m": "3 meses",
  "6m": "6 meses",
  "1a": "12 meses",
};

export function parsePeriodo(value?: string): AnalyticsPeriodo {
  return value === "3m" || value === "6m" || value === "1a" ? value : "atual";
}

export interface AnalyticsMesSerie {
  label: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface AnalyticsCategoriaFatia {
  nome: string;
  valor: number;
  cor: string;
  percentual: number;
}

export interface AnalyticsFixasResumo {
  pagas: number;
  pendentes: number;
  vencidas: number;
}

export interface AnalyticsData {
  periodo: AnalyticsPeriodo;
  meses: AnalyticsMesSerie[];
  despesasPorCategoria: AnalyticsCategoriaFatia[];
  totalReceitas: number;
  totalDespesas: number;
  fixas: AnalyticsFixasResumo;
}

export async function getAnalyticsData(
  userId: string,
  periodo: AnalyticsPeriodo
): Promise<AnalyticsData> {
  const qtdMeses = PERIODO_MESES[periodo];
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (qtdMeses - 1), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [movs, fixasAtivas, categorias] = await Promise.all([
    prisma.movimentacao.findMany({
      where: { userId, isDeleted: false, data: { gte: start, lt: end } },
      select: { valor: true, isEntrada: true, data: true, categoria: true },
    }),
    prisma.movimentacaoFixa.findMany({
      where: { userId, isDeleted: false, ativo: true },
      select: {
        pago: true,
        dataUltimoPagamento: true,
        diaVencimento: true,
        dataVencimento: true,
        dataFim: true,
      },
    }),
    prisma.categoria.findMany({
      where: { userId, isDeleted: false },
      select: { nome: true, cor: true },
    }),
  ]);

  // ── Série mensal (uma passada sobre as movimentações) ──
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    ...(qtdMeses > 6 ? { year: "2-digit" } : {}),
  });
  const meses: AnalyticsMesSerie[] = [];
  const idxByKey = new Map<string, number>();
  for (let i = 0; i < qtdMeses; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    idxByKey.set(`${d.getFullYear()}-${d.getMonth()}`, i);
    meses.push({
      label: fmt.format(d).replace(".", ""),
      receitas: 0,
      despesas: 0,
      saldo: 0,
    });
  }

  const porCategoria = new Map<string, number>();
  for (const m of movs) {
    const valor = Number(String(m.valor));
    const d = new Date(m.data);
    const idx = idxByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (idx !== undefined) {
      if (m.isEntrada) meses[idx].receitas += valor;
      else meses[idx].despesas += valor;
    }
    if (!m.isEntrada) {
      const key = m.categoria || "Sem categoria";
      porCategoria.set(key, (porCategoria.get(key) ?? 0) + valor);
    }
  }
  for (const s of meses) s.saldo = s.receitas - s.despesas;

  const totalReceitas = meses.reduce((acc, s) => acc + s.receitas, 0);
  const totalDespesas = meses.reduce((acc, s) => acc + s.despesas, 0);

  // ── Distribuição de despesas por categoria (top 6 + Outras) ──
  const corByNome = new Map(categorias.map((c) => [c.nome, c.cor]));
  const ordenadas = [...porCategoria.entries()].sort((a, b) => b[1] - a[1]);
  const top = ordenadas.slice(0, 6);
  const restante = ordenadas.slice(6).reduce((acc, [, v]) => acc + v, 0);

  const despesasPorCategoria: AnalyticsCategoriaFatia[] = top.map(([nome, valor]) => ({
    nome,
    valor,
    cor: corByNome.get(nome) ?? "#6b7280",
    percentual: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
  }));
  if (restante > 0) {
    despesasPorCategoria.push({
      nome: "Outras",
      valor: restante,
      cor: "#9ca3af",
      percentual: (restante / totalDespesas) * 100,
    });
  }

  // ── Fixas pagas x pendentes (ciclo do mês atual) ──
  const fixasDoCiclo = fixasAtivas.filter((f) => !isEncerrada(f.dataFim, now));
  const pagas = fixasDoCiclo.filter((f) =>
    isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)
  ).length;
  const naoPagas = fixasDoCiclo.filter(
    (f) => !isPagoNoCiclo(f.pago, f.dataUltimoPagamento, now)
  );
  const vencidas = naoPagas.filter((f) => {
    const venc = vencimentoNoCiclo(f.diaVencimento, f.dataVencimento, now);
    return venc !== null && venc < now;
  }).length;

  return {
    periodo,
    meses,
    despesasPorCategoria,
    totalReceitas,
    totalDespesas,
    fixas: { pagas, pendentes: naoPagas.length, vencidas },
  };
}
