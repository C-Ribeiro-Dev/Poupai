import "server-only";
import { prisma } from "@/lib/prisma";
import type { MovimentacaoFixaRow } from "@/types/movimentacoes-fixas";

export async function getMovimentacoesFixas(userId: string): Promise<MovimentacaoFixaRow[]> {
  const raw = await prisma.movimentacaoFixa.findMany({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      valor: true,
      tipoMovimentacaoId: true,
      tipoMovimentacao: { select: { nome: true } },
      isEntrada: true,
      diaVencimento: true,
      dataVencimento: true,
      dataFim: true,
      categoria: true,
      formaPagamento: true,
      observacoes: true,
      ativo: true,
      pago: true,
      dataUltimoPagamento: true,
      createdAt: true,
    },
  });

  return raw.map((m) => ({
    id: m.id,
    nome: m.nome,
    valor: Number(String(m.valor)),
    tipoMovimentacaoId: m.tipoMovimentacaoId,
    tipoNome: m.tipoMovimentacao.nome,
    isEntrada: m.isEntrada,
    diaVencimento: m.diaVencimento,
    dataVencimento: m.dataVencimento,
    dataFim: m.dataFim,
    categoria: m.categoria,
    formaPagamento: m.formaPagamento,
    observacoes: m.observacoes,
    ativo: m.ativo,
    pago: m.pago,
    dataUltimoPagamento: m.dataUltimoPagamento,
    createdAt: m.createdAt,
  }));
}
