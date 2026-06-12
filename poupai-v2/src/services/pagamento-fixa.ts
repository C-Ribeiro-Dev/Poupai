import "server-only";
import { prisma } from "@/lib/prisma";
import { isPagoNoCiclo } from "@/lib/fixas-ciclo";

export async function executarPagamentoFixa(fixaId: number, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const fixa = await tx.movimentacaoFixa.findFirst({
      where: { id: fixaId, userId, isDeleted: false },
    });

    if (!fixa) throw new Error("Movimentação fixa não encontrada.");
    if (!fixa.ativo) throw new Error("Esta movimentação fixa está inativa.");
    // "Pago" vale só dentro do mês do último pagamento — em mês novo pode pagar de novo
    if (isPagoNoCiclo(fixa.pago, fixa.dataUltimoPagamento)) {
      throw new Error("Esta movimentação fixa já foi paga neste mês.");
    }

    const now = new Date();
    const dataNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

    await tx.movimentacaoFixa.update({
      where: { id: fixaId },
      data: {
        pago: true,
        dataUltimoPagamento: now,
      },
    });

    await tx.movimentacao.create({
      data: {
        userId,
        tipoId: fixa.tipoMovimentacaoId,
        valor: fixa.valor,
        data: dataNoon,
        categoria: fixa.categoria,
        descricao: fixa.nome,
        isEntrada: fixa.isEntrada,
        isFixaOuDiaria: true,
        movimentacaoFixaId: fixa.id,
      },
    });
  });
}

export async function desfazerPagamentoFixa(fixaId: number, userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const fixa = await tx.movimentacaoFixa.findFirst({
      where: { id: fixaId, userId, isDeleted: false },
      select: { id: true },
    });

    if (!fixa) throw new Error("Movimentação fixa não encontrada.");

    await tx.movimentacaoFixa.update({
      where: { id: fixaId },
      data: { pago: false, dataUltimoPagamento: null },
    });

    // Soft-delete a movimentação gerada automaticamente (a mais recente vinculada a esta fixa)
    const movGerada = await tx.movimentacao.findFirst({
      where: { movimentacaoFixaId: fixaId, userId, isDeleted: false, isFixaOuDiaria: true },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (movGerada) {
      await tx.movimentacao.update({
        where: { id: movGerada.id },
        data: { isDeleted: true },
      });
    }
  });
}
