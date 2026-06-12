"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getCurrentUserId } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { movimentacaoSchema, type MovimentacaoFormData } from "@/types/movimentacoes";

export type MovimentacaoActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createMovimentacaoAction(
  data: MovimentacaoFormData
): Promise<MovimentacaoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = movimentacaoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique os campos." };
  }

  // REGRA CRÍTICA: isEntrada é copiado do TipoMovimentacao — nunca vem do formulário
  const tipo = await prisma.tipoMovimentacao.findFirst({
    where: { id: parsed.data.tipoId, userId, isDeleted: false },
    select: { isEntrada: true },
  });
  if (!tipo) {
    return { success: false, error: "Tipo de movimentação não encontrado." };
  }

  await prisma.movimentacao.create({
    data: {
      userId,
      tipoId: parsed.data.tipoId,
      valor: parsed.data.valor,
      data: new Date(`${parsed.data.data}T12:00:00.000Z`),
      categoria: parsed.data.categoria || null,
      descricao: parsed.data.descricao || null,
      isEntrada: tipo.isEntrada,
      isFixaOuDiaria: false,
      contaId: parsed.data.contaId || null,
    },
  });

  revalidatePath("/movimentacoes");
  return { success: true };
}

export async function updateMovimentacaoAction(
  id: number,
  data: MovimentacaoFormData
): Promise<MovimentacaoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = movimentacaoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Verifique os campos." };
  }

  const existing = await prisma.movimentacao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Movimentação não encontrada." };
  }

  // REGRA CRÍTICA: recalcular isEntrada com base no novo tipo selecionado
  const tipo = await prisma.tipoMovimentacao.findFirst({
    where: { id: parsed.data.tipoId, userId, isDeleted: false },
    select: { isEntrada: true },
  });
  if (!tipo) {
    return { success: false, error: "Tipo de movimentação não encontrado." };
  }

  await prisma.movimentacao.update({
    where: { id },
    data: {
      tipoId: parsed.data.tipoId,
      valor: parsed.data.valor,
      data: new Date(`${parsed.data.data}T12:00:00.000Z`),
      categoria: parsed.data.categoria || null,
      descricao: parsed.data.descricao || null,
      isEntrada: tipo.isEntrada,
      contaId: parsed.data.contaId || null,
    },
  });

  revalidatePath("/movimentacoes");
  return { success: true };
}

export async function deleteMovimentacaoAction(
  id: number
): Promise<MovimentacaoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.movimentacao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true, movimentacaoFixaId: true, isFixaOuDiaria: true },
  });
  if (!existing) {
    return { success: false, error: "Movimentação não encontrada." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.movimentacao.update({
      where: { id },
      data: { isDeleted: true },
    });

    if (existing.isFixaOuDiaria && existing.movimentacaoFixaId) {
      await tx.movimentacaoFixa.updateMany({
        where: { id: existing.movimentacaoFixaId, userId },
        data: { pago: false, dataUltimoPagamento: null },
      });
    }
  });

  revalidatePath("/movimentacoes");
  revalidatePath("/movimentacoes-fixas");
  return { success: true };
}

export async function batchDeleteMovimentacaoAction(
  ids: number[]
): Promise<MovimentacaoActionResult> {
  if (!ids.length) return { success: false, error: "Nenhum item selecionado." };
  const userId = await getCurrentUserId();

  const fixasIds = await prisma.movimentacao.findMany({
    where: { id: { in: ids }, userId, isDeleted: false, isFixaOuDiaria: true, movimentacaoFixaId: { not: null } },
    select: { movimentacaoFixaId: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.movimentacao.updateMany({
      where: { id: { in: ids }, userId, isDeleted: false },
      data: { isDeleted: true },
    });

    const fixaIdList = fixasIds.map((m) => m.movimentacaoFixaId!);
    if (fixaIdList.length) {
      await tx.movimentacaoFixa.updateMany({
        where: { id: { in: fixaIdList }, userId },
        data: { pago: false, dataUltimoPagamento: null },
      });
    }
  });

  revalidatePath("/movimentacoes");
  revalidatePath("/movimentacoes-fixas");
  return { success: true };
}

export async function batchHardDeleteMovimentacaoAction(
  ids: number[]
): Promise<MovimentacaoActionResult> {
  if (!ids.length) return { success: false, error: "Nenhum item selecionado." };
  const user = await getCurrentUser();
  if (!isAdminEmail(user?.email)) {
    return { success: false, error: "Acesso restrito ao administrador." };
  }
  await prisma.movimentacao.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/movimentacoes");
  return { success: true };
}

export async function hardDeleteMovimentacaoAction(
  id: number
): Promise<MovimentacaoActionResult> {
  const user = await getCurrentUser();
  if (!isAdminEmail(user?.email)) {
    return { success: false, error: "Acesso restrito ao administrador." };
  }

  const existing = await prisma.movimentacao.findFirst({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Movimentação não encontrada." };
  }

  await prisma.movimentacao.delete({ where: { id } });

  revalidatePath("/movimentacoes");
  return { success: true };
}
