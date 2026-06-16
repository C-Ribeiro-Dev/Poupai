"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dividaSchema, type DividaFormData } from "@/types/dividas";

export type DividaResult = { success: true } | { success: false; error: string };

export async function createDividaAction(data: DividaFormData): Promise<DividaResult> {
  const userId = await getCurrentUserId();
  const parsed = dividaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const d = parsed.data;
  await prisma.divida.create({
    data: {
      userId,
      credor: d.credor,
      descricao: d.descricao || null,
      valorTotal: d.valorTotal,
      taxaJurosMensal: d.taxaJurosMensal,
      nParcelas: d.nParcelas,
      parcelasPagas: d.parcelasPagas ?? 0,
      dataInicio: new Date(d.dataInicio),
      dataProxVencimento: d.dataProxVencimento ? new Date(d.dataProxVencimento) : null,
      categoria: d.categoria || null,
      observacoes: d.observacoes || null,
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/compromissos");
  revalidatePath("/saldo-projetado");
  revalidatePath("/");
  return { success: true };
}

export async function updateDividaAction(
  id: number,
  data: DividaFormData
): Promise<DividaResult> {
  const userId = await getCurrentUserId();
  const parsed = dividaSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const exists = await prisma.divida.findFirst({ where: { id, userId, isDeleted: false } });
  if (!exists) return { success: false, error: "Dívida não encontrada." };

  const d = parsed.data;
  const quitada = d.parcelasPagas >= d.nParcelas;

  await prisma.divida.update({
    where: { id },
    data: {
      credor: d.credor,
      descricao: d.descricao || null,
      valorTotal: d.valorTotal,
      taxaJurosMensal: d.taxaJurosMensal,
      nParcelas: d.nParcelas,
      parcelasPagas: d.parcelasPagas ?? 0,
      dataInicio: new Date(d.dataInicio),
      dataProxVencimento: d.dataProxVencimento ? new Date(d.dataProxVencimento) : null,
      categoria: d.categoria || null,
      observacoes: d.observacoes || null,
      quitada,
    },
  });

  revalidatePath("/dividas");
  revalidatePath("/compromissos");
  revalidatePath("/saldo-projetado");
  revalidatePath("/");
  return { success: true };
}

export async function pagarParcelaAction(id: number): Promise<DividaResult> {
  const userId = await getCurrentUserId();
  const divida = await prisma.divida.findFirst({ where: { id, userId, isDeleted: false } });
  if (!divida) return { success: false, error: "Dívida não encontrada." };
  if (divida.quitada) return { success: false, error: "Esta dívida já está quitada." };

  const novasPagas = divida.parcelasPagas + 1;
  const quitada = novasPagas >= divida.nParcelas;

  await prisma.divida.update({
    where: { id },
    data: { parcelasPagas: novasPagas, quitada },
  });

  revalidatePath("/dividas");
  revalidatePath("/compromissos");
  revalidatePath("/saldo-projetado");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDividaAction(id: number): Promise<DividaResult> {
  const userId = await getCurrentUserId();
  const exists = await prisma.divida.findFirst({ where: { id, userId, isDeleted: false } });
  if (!exists) return { success: false, error: "Dívida não encontrada." };

  await prisma.divida.update({ where: { id }, data: { isDeleted: true } });
  revalidatePath("/dividas");
  revalidatePath("/compromissos");
  revalidatePath("/saldo-projetado");
  revalidatePath("/");
  return { success: true };
}

export async function batchDeleteDividaAction(ids: number[]): Promise<DividaResult> {
  if (ids.length === 0) return { success: false, error: "Nenhuma dívida selecionada." };
  const userId = await getCurrentUserId();
  await prisma.divida.updateMany({
    where: { id: { in: ids }, userId, isDeleted: false },
    data: { isDeleted: true },
  });
  revalidatePath("/dividas");
  revalidatePath("/compromissos");
  revalidatePath("/saldo-projetado");
  revalidatePath("/");
  return { success: true };
}
