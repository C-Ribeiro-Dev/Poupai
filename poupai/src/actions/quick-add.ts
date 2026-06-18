"use server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface OrcamentoQuick {
  categoria: string;
  limite: number;
  gasto: number;
}

export interface QuickAddOptions {
  tipos: { id: number; nome: string; isEntrada: boolean }[];
  contas: { id: number; nome: string; tipo: string; cor: string }[];
  categorias: { nome: string; tipo: string; ativo: boolean }[];
  cartoes: { id: number; nome: string; cor: string; diaFechamento: number }[];
  orcamentos: OrcamentoQuick[];
}

export async function getQuickAddOptionsAction(): Promise<QuickAddOptions> {
  const userId = await getCurrentUserId();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [tipos, contas, categorias, cartoes, orcamentosRaw, gastosRaw] = await Promise.all([
    prisma.tipoMovimentacao.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, nome: true, isEntrada: true },
    }),
    prisma.conta.findMany({
      where: { userId, isDeleted: false, ativo: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, nome: true, tipo: true, cor: true },
    }),
    prisma.categoria.findMany({
      where: { userId, isDeleted: false, ativo: true },
      orderBy: [{ tipo: "asc" }, { nome: "asc" }],
      select: { nome: true, tipo: true, ativo: true },
    }),
    prisma.cartao.findMany({
      where: { userId, isDeleted: false, ativo: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, nome: true, cor: true, diaFechamento: true },
    }),
    prisma.orcamento.findMany({
      where: { userId, isDeleted: false },
      select: { categoria: true, valor: true },
    }),
    prisma.movimentacao.groupBy({
      by: ["categoria"],
      where: {
        userId,
        isDeleted: false,
        isEntrada: false,
        categoria: { not: null },
        data: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { valor: true },
    }),
  ]);

  const gastoMap = new Map(
    gastosRaw.map((g) => [g.categoria!, Number(g._sum.valor ?? 0)])
  );

  const orcamentos: OrcamentoQuick[] = orcamentosRaw.map((o) => ({
    categoria: o.categoria,
    limite: Number(o.valor),
    gasto: gastoMap.get(o.categoria) ?? 0,
  }));

  return { tipos, contas, categorias, cartoes, orcamentos };
}
