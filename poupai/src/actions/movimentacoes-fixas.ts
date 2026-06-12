"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  movimentacaoFixaSchema,
  type MovimentacaoFixaFormData,
} from "@/types/movimentacoes-fixas";
import { executarPagamentoFixa, desfazerPagamentoFixa } from "@/services/pagamento-fixa";

export type FixaActionResult = { success: true } | { success: false; error: string };

function computeDataVencimento(diaVencimento: number): Date {
  const now = new Date();
  const dueThisMonth = new Date(now.getFullYear(), now.getMonth(), diaVencimento, 12, 0, 0);
  return dueThisMonth >= now
    ? dueThisMonth
    : new Date(now.getFullYear(), now.getMonth() + 1, diaVencimento, 12, 0, 0);
}

export async function createMovimentacaoFixaAction(
  data: MovimentacaoFixaFormData
): Promise<FixaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = movimentacaoFixaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos. Verifique os campos." };

  // REGRA CRÍTICA: isEntrada é copiado do TipoMovimentacao — nunca vem do formulário
  const tipo = await prisma.tipoMovimentacao.findFirst({
    where: { id: parsed.data.tipoMovimentacaoId, userId, isDeleted: false },
    select: { isEntrada: true },
  });
  if (!tipo) return { success: false, error: "Tipo de movimentação não encontrado." };

  await prisma.movimentacaoFixa.create({
    data: {
      userId,
      tipoMovimentacaoId: parsed.data.tipoMovimentacaoId,
      nome: parsed.data.nome,
      valor: parsed.data.valor,
      isEntrada: tipo.isEntrada,
      diaVencimento: parsed.data.diaVencimento ?? null,
      dataVencimento: parsed.data.diaVencimento
        ? computeDataVencimento(parsed.data.diaVencimento)
        : null,
      dataFim: parsed.data.dataFim ? new Date(`${parsed.data.dataFim}T12:00:00.000Z`) : null,
      categoria: parsed.data.categoria || null,
      formaPagamento: parsed.data.formaPagamento || null,
      observacoes: parsed.data.observacoes || null,
      ativo: parsed.data.ativo,
    },
  });

  revalidatePath("/movimentacoes-fixas");
  return { success: true };
}

export async function updateMovimentacaoFixaAction(
  id: number,
  data: MovimentacaoFixaFormData
): Promise<FixaActionResult> {
  const userId = await getCurrentUserId();

  const parsed = movimentacaoFixaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos. Verifique os campos." };

  const existing = await prisma.movimentacaoFixa.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Movimentação fixa não encontrada." };

  // REGRA CRÍTICA: recalcular isEntrada com base no novo tipo selecionado
  const tipo = await prisma.tipoMovimentacao.findFirst({
    where: { id: parsed.data.tipoMovimentacaoId, userId, isDeleted: false },
    select: { isEntrada: true },
  });
  if (!tipo) return { success: false, error: "Tipo de movimentação não encontrado." };

  await prisma.movimentacaoFixa.update({
    where: { id },
    data: {
      tipoMovimentacaoId: parsed.data.tipoMovimentacaoId,
      nome: parsed.data.nome,
      valor: parsed.data.valor,
      isEntrada: tipo.isEntrada,
      diaVencimento: parsed.data.diaVencimento ?? null,
      dataVencimento: parsed.data.diaVencimento
        ? computeDataVencimento(parsed.data.diaVencimento)
        : null,
      dataFim: parsed.data.dataFim ? new Date(`${parsed.data.dataFim}T12:00:00.000Z`) : null,
      categoria: parsed.data.categoria || null,
      formaPagamento: parsed.data.formaPagamento || null,
      observacoes: parsed.data.observacoes || null,
      ativo: parsed.data.ativo,
    },
  });

  revalidatePath("/movimentacoes-fixas");
  return { success: true };
}

export async function deleteMovimentacaoFixaAction(id: number): Promise<FixaActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.movimentacaoFixa.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Movimentação fixa não encontrada." };

  await prisma.movimentacaoFixa.update({
    where: { id },
    data: { isDeleted: true },
  });

  revalidatePath("/movimentacoes-fixas");
  return { success: true };
}

export async function marcarComoPagoAction(id: number): Promise<FixaActionResult> {
  const userId = await getCurrentUserId();

  try {
    await executarPagamentoFixa(id, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao registrar pagamento.";
    return { success: false, error: message };
  }

  revalidatePath("/movimentacoes-fixas");
  revalidatePath("/movimentacoes");
  return { success: true };
}

export async function desmarcarPagamentoAction(id: number): Promise<FixaActionResult> {
  const userId = await getCurrentUserId();

  try {
    await desfazerPagamentoFixa(id, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao desfazer pagamento.";
    return { success: false, error: message };
  }

  revalidatePath("/movimentacoes-fixas");
  revalidatePath("/movimentacoes");
  return { success: true };
}
