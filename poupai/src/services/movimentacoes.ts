import "server-only";
import { prisma } from "@/lib/prisma";
import type { MovimentacaoRow } from "@/types/movimentacoes";

export async function getMovimentacoes(userId: string): Promise<MovimentacaoRow[]> {
  const raw = await prisma.movimentacao.findMany({
    where: { userId, isDeleted: false },
    orderBy: { data: "desc" },
    select: {
      id: true,
      valor: true,
      tipoId: true,
      tipo: { select: { nome: true } },
      isEntrada: true,
      data: true,
      categoria: true,
      descricao: true,
      isFixaOuDiaria: true,
      movimentacaoFixaId: true,
      contaId: true,
      conta: { select: { nome: true } },
      createdAt: true,
    },
  });

  return raw.map((m) => ({
    id: m.id,
    valor: Number(String(m.valor)),
    tipoId: m.tipoId,
    tipoNome: m.tipo.nome,
    isEntrada: m.isEntrada,
    data: m.data,
    categoria: m.categoria,
    descricao: m.descricao,
    isFixaOuDiaria: m.isFixaOuDiaria,
    movimentacaoFixaId: m.movimentacaoFixaId,
    contaId: m.contaId,
    contaNome: m.conta?.nome ?? null,
    createdAt: m.createdAt,
  }));
}
