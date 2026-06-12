import "server-only";
import { prisma } from "@/lib/prisma";
import { computeMetaDerivados, type MetaRow } from "@/types/metas";

export async function getMetas(userId: string): Promise<MetaRow[]> {
  const [metas, aportesAgg] = await Promise.all([
    prisma.meta.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nome: true,
        descricao: true,
        valorAlvo: true,
        dataAlvo: true,
        cor: true,
        createdAt: true,
      },
    }),
    prisma.metaAporte.groupBy({
      by: ["metaId"],
      where: { userId, isDeleted: false },
      _sum: { valor: true },
    }),
  ]);

  const aportadoByMeta = new Map(
    aportesAgg.map((a) => [a.metaId, Number(String(a._sum.valor ?? 0))])
  );

  return metas.map((m) => {
    const valorAlvo = Number(String(m.valorAlvo));
    const totalAportado = aportadoByMeta.get(m.id) ?? 0;
    const derivados = computeMetaDerivados(valorAlvo, totalAportado, m.dataAlvo);
    return {
      id: m.id,
      nome: m.nome,
      descricao: m.descricao,
      valorAlvo,
      dataAlvo: m.dataAlvo,
      cor: m.cor,
      totalAportado,
      createdAt: m.createdAt,
      ...derivados,
    };
  });
}

export interface MetaResumoDashboard {
  id: number;
  nome: string;
  cor: string;
  percentual: number;
  valorAlvo: number;
  totalAportado: number;
}

export async function getMetasResumo(userId: string): Promise<MetaResumoDashboard[]> {
  const metas = await getMetas(userId);
  return metas
    .filter((m) => m.status !== "concluida")
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 3)
    .map((m) => ({
      id: m.id,
      nome: m.nome,
      cor: m.cor,
      percentual: m.percentual,
      valorAlvo: m.valorAlvo,
      totalAportado: m.totalAportado,
    }));
}
