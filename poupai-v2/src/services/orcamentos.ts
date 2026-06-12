import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getOrcamentoStatus,
  type OrcamentoRow,
  type OrcamentoResumo,
} from "@/types/orcamentos";

export interface OrcamentosData {
  orcamentos: OrcamentoRow[];
  resumo: OrcamentoResumo;
  mes: string;
}

export async function getOrcamentosComGasto(
  userId: string,
  mesRef?: Date
): Promise<OrcamentosData> {
  const ref = mesRef ?? new Date();
  const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const startOfNextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);

  const [orcamentos, gastosPorCategoria, categorias] = await Promise.all([
    prisma.orcamento.findMany({
      where: { userId, isDeleted: false },
      orderBy: { categoria: "asc" },
      select: { id: true, categoria: true, valor: true },
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
    prisma.categoria.findMany({
      where: { userId, isDeleted: false },
      select: { nome: true, cor: true, icone: true },
    }),
  ]);

  const gastoByCategoria = new Map(
    gastosPorCategoria.map((g) => [g.categoria!, Number(String(g._sum.valor ?? 0))])
  );
  const visualByCategoria = new Map(categorias.map((c) => [c.nome, c]));

  const rows: OrcamentoRow[] = orcamentos.map((o) => {
    const valor = Number(String(o.valor));
    const gasto = gastoByCategoria.get(o.categoria) ?? 0;
    const percentual = valor > 0 ? (gasto / valor) * 100 : 0;
    const visual = visualByCategoria.get(o.categoria);
    return {
      id: o.id,
      categoria: o.categoria,
      cor: visual?.cor ?? "#6b7280",
      icone: visual?.icone ?? "tag",
      valor,
      gasto,
      disponivel: valor - gasto,
      percentual,
      status: getOrcamentoStatus(percentual),
    };
  });

  const totalPlanejado = rows.reduce((acc, r) => acc + r.valor, 0);
  const totalGasto = rows.reduce((acc, r) => acc + r.gasto, 0);

  return {
    orcamentos: rows,
    resumo: {
      totalPlanejado,
      totalGasto,
      totalDisponivel: totalPlanejado - totalGasto,
      categoriasEstouradas: rows.filter((r) => r.status === "estourado").map((r) => r.categoria),
      categoriasEmAtencao: rows.filter((r) => r.status === "atencao").map((r) => r.categoria),
    },
    mes: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(ref),
  };
}
