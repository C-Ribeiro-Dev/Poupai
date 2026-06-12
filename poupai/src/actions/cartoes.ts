"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  cartaoSchema,
  compraCartaoSchema,
  type CartaoFormData,
  type CompraCartaoFormData,
} from "@/types/cartoes";
import { mesRefLabel } from "@/lib/cartao-fatura";

export type CartaoActionResult = { success: true } | { success: false; error: string };

const toNoonUTC = (dateStr: string) => new Date(`${dateStr}T12:00:00.000Z`);

export async function createCartaoAction(data: CartaoFormData): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = cartaoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  await prisma.cartao.create({
    data: {
      userId,
      nome: parsed.data.nome,
      bandeira: parsed.data.bandeira || null,
      limite: parsed.data.limite,
      diaFechamento: parsed.data.diaFechamento,
      diaVencimento: parsed.data.diaVencimento,
      cor: parsed.data.cor,
    },
  });

  revalidatePath("/cartoes");
  return { success: true };
}

export async function updateCartaoAction(
  id: number,
  data: CartaoFormData
): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = cartaoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.cartao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Cartão não encontrado." };

  await prisma.cartao.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      bandeira: parsed.data.bandeira || null,
      limite: parsed.data.limite,
      diaFechamento: parsed.data.diaFechamento,
      diaVencimento: parsed.data.diaVencimento,
      cor: parsed.data.cor,
    },
  });

  revalidatePath("/cartoes");
  return { success: true };
}

export async function deleteCartaoAction(id: number): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.cartao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Cartão não encontrado." };

  await prisma.cartao.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/cartoes");
  return { success: true };
}

export async function createCompraCartaoAction(
  cartaoId: number,
  data: CompraCartaoFormData
): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = compraCartaoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const cartao = await prisma.cartao.findFirst({
    where: { id: cartaoId, userId, isDeleted: false },
    select: { id: true },
  });
  if (!cartao) return { success: false, error: "Cartão não encontrado." };

  await prisma.compraCartao.create({
    data: {
      userId,
      cartaoId,
      descricao: parsed.data.descricao,
      categoria: parsed.data.categoria || null,
      valorTotal: parsed.data.valorTotal,
      parcelas: parsed.data.parcelas,
      dataCompra: toNoonUTC(parsed.data.dataCompra),
    },
  });

  revalidatePath("/cartoes");
  return { success: true };
}

export async function deleteCompraCartaoAction(id: number): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.compraCartao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Compra não encontrada." };

  await prisma.compraCartao.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/cartoes");
  return { success: true };
}

// Paga a fatura: registra o pagamento e cria a Movimentacao de saída correspondente
export async function pagarFaturaAction(
  cartaoId: number,
  mesRef: string,
  valor: number,
  tipoId: number
): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  if (!/^\d{4}-\d{2}$/.test(mesRef) || valor <= 0 || !Number.isInteger(tipoId)) {
    return { success: false, error: "Dados inválidos." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const cartao = await tx.cartao.findFirst({
        where: { id: cartaoId, userId, isDeleted: false },
        select: { id: true, nome: true },
      });
      if (!cartao) throw new Error("Cartão não encontrado.");

      const tipo = await tx.tipoMovimentacao.findFirst({
        where: { id: tipoId, userId, isDeleted: false },
        select: { id: true, isEntrada: true },
      });
      if (!tipo) throw new Error("Tipo de movimentação não encontrado.");

      const jaPaga = await tx.faturaPagamento.findFirst({
        where: { cartaoId, mesRef },
        select: { id: true },
      });
      if (jaPaga) throw new Error("Esta fatura já foi paga.");

      const now = new Date();
      const dataNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

      const mov = await tx.movimentacao.create({
        data: {
          userId,
          tipoId: tipo.id,
          valor,
          data: dataNoon,
          categoria: "Cartão de crédito",
          descricao: `Fatura ${cartao.nome} — ${mesRefLabel(mesRef)}`,
          isEntrada: tipo.isEntrada,
        },
      });

      await tx.faturaPagamento.create({
        data: { userId, cartaoId, mesRef, valor, movimentacaoId: mov.id },
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao pagar fatura.";
    return { success: false, error: message };
  }

  revalidatePath("/cartoes");
  revalidatePath("/movimentacoes");
  revalidatePath("/");
  return { success: true };
}

export async function desfazerPagamentoFaturaAction(
  cartaoId: number,
  mesRef: string
): Promise<CartaoActionResult> {
  const userId = await getCurrentUserId();

  try {
    await prisma.$transaction(async (tx) => {
      const pagamento = await tx.faturaPagamento.findFirst({
        where: { cartaoId, mesRef, userId },
        select: { id: true, movimentacaoId: true },
      });
      if (!pagamento) throw new Error("Pagamento não encontrado.");

      await tx.faturaPagamento.delete({ where: { id: pagamento.id } });

      if (pagamento.movimentacaoId) {
        await tx.movimentacao.updateMany({
          where: { id: pagamento.movimentacaoId, userId },
          data: { isDeleted: true },
        });
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao desfazer pagamento.";
    return { success: false, error: message };
  }

  revalidatePath("/cartoes");
  revalidatePath("/movimentacoes");
  revalidatePath("/");
  return { success: true };
}
