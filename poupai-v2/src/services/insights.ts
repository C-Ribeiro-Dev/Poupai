import "server-only";
import { prisma } from "@/lib/prisma";

export interface InsightsMes {
  topGasto: { categoria: string; valor: number } | null;
  topReceita: { categoria: string; valor: number } | null;
  totalLancamentos: number;
}

export async function getInsightsMes(userId: string, mesRef?: Date): Promise<InsightsMes> {
  const ref = mesRef ?? new Date();
  const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const startOfNextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

  const baseWhere = {
    userId,
    isDeleted: false,
    data: { gte: startOfMonth, lt: startOfNextMonth },
  };

  const [gastosPorCategoria, receitasPorCategoria, totalLancamentos] = await Promise.all([
    prisma.movimentacao.groupBy({
      by: ["categoria"],
      where: { ...baseWhere, isEntrada: false, categoria: { not: null } },
      _sum: { valor: true },
      orderBy: { _sum: { valor: "desc" } },
      take: 1,
    }),
    prisma.movimentacao.groupBy({
      by: ["categoria"],
      where: { ...baseWhere, isEntrada: true, categoria: { not: null } },
      _sum: { valor: true },
      orderBy: { _sum: { valor: "desc" } },
      take: 1,
    }),
    prisma.movimentacao.count({ where: baseWhere }),
  ]);

  const topGasto =
    gastosPorCategoria[0]?.categoria != null
      ? {
          categoria: gastosPorCategoria[0].categoria!,
          valor: Number(String(gastosPorCategoria[0]._sum.valor ?? 0)),
        }
      : null;

  const topReceita =
    receitasPorCategoria[0]?.categoria != null
      ? {
          categoria: receitasPorCategoria[0].categoria!,
          valor: Number(String(receitasPorCategoria[0]._sum.valor ?? 0)),
        }
      : null;

  return { topGasto, topReceita, totalLancamentos };
}
