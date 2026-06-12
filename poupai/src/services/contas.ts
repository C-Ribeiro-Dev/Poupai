import "server-only";
import { prisma } from "@/lib/prisma";
import type { ContaRow, TransferenciaRow, TipoConta } from "@/types/contas";

export interface ContasData {
  contas: ContaRow[];
  saldoConsolidado: number;
  transferenciasRecentes: TransferenciaRow[];
}

export async function getContas(userId: string): Promise<ContasData> {
  const [contas, movAgg, transfOrigem, transfDestino, transferenciasRecentes] =
    await Promise.all([
      prisma.conta.findMany({
        where: { userId, isDeleted: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          nome: true,
          tipo: true,
          instituicao: true,
          cor: true,
          saldoInicial: true,
          ativo: true,
          createdAt: true,
        },
      }),
      prisma.movimentacao.groupBy({
        by: ["contaId", "isEntrada"],
        where: { userId, isDeleted: false, contaId: { not: null } },
        _sum: { valor: true },
      }),
      prisma.transferencia.groupBy({
        by: ["deContaId"],
        where: { userId, isDeleted: false },
        _sum: { valor: true },
      }),
      prisma.transferencia.groupBy({
        by: ["paraContaId"],
        where: { userId, isDeleted: false },
        _sum: { valor: true },
      }),
      prisma.transferencia.findMany({
        where: { userId, isDeleted: false },
        orderBy: { data: "desc" },
        take: 5,
        select: {
          id: true,
          valor: true,
          data: true,
          descricao: true,
          deConta: { select: { nome: true } },
          paraConta: { select: { nome: true } },
        },
      }),
    ]);

  const movByConta = new Map<string, number>();
  for (const m of movAgg) {
    movByConta.set(`${m.contaId}-${m.isEntrada}`, Number(String(m._sum.valor ?? 0)));
  }
  const saidasTransf = new Map(
    transfOrigem.map((t) => [t.deContaId, Number(String(t._sum.valor ?? 0))])
  );
  const entradasTransf = new Map(
    transfDestino.map((t) => [t.paraContaId, Number(String(t._sum.valor ?? 0))])
  );

  const rows: ContaRow[] = contas.map((c) => {
    const saldoInicial = Number(String(c.saldoInicial));
    const entradas = movByConta.get(`${c.id}-true`) ?? 0;
    const saidas = movByConta.get(`${c.id}-false`) ?? 0;
    const saldoAtual =
      saldoInicial +
      entradas -
      saidas +
      (entradasTransf.get(c.id) ?? 0) -
      (saidasTransf.get(c.id) ?? 0);
    return {
      id: c.id,
      nome: c.nome,
      tipo: c.tipo as TipoConta,
      instituicao: c.instituicao,
      cor: c.cor,
      saldoInicial,
      saldoAtual,
      ativo: c.ativo,
      createdAt: c.createdAt,
    };
  });

  return {
    contas: rows,
    saldoConsolidado: rows.filter((c) => c.ativo).reduce((acc, c) => acc + c.saldoAtual, 0),
    transferenciasRecentes: transferenciasRecentes.map((t) => ({
      id: t.id,
      deContaNome: t.deConta.nome,
      paraContaNome: t.paraConta.nome,
      valor: Number(String(t.valor)),
      data: t.data,
      descricao: t.descricao,
    })),
  };
}
