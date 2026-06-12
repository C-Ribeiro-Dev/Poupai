"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ativoSchema,
  lancamentoSchema,
  type AtivoFormData,
  type LancamentoFormData,
} from "@/types/investimentos";

export type InvestimentoActionResult = { success: true } | { success: false; error: string };

const toNoonUTC = (dateStr: string) => new Date(`${dateStr}T12:00:00.000Z`);

export async function createAtivoAction(data: AtivoFormData): Promise<InvestimentoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = ativoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  await prisma.ativoInvestimento.create({
    data: {
      userId,
      nome: parsed.data.nome,
      classe: parsed.data.classe,
      valorAtual: parsed.data.valorAtual ?? null,
      dataAtualizacao: parsed.data.valorAtual !== undefined ? new Date() : null,
    },
  });

  revalidatePath("/investimentos");
  return { success: true };
}

export async function updateAtivoAction(
  id: number,
  data: AtivoFormData
): Promise<InvestimentoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = ativoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.ativoInvestimento.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true, valorAtual: true },
  });
  if (!existing) return { success: false, error: "Ativo não encontrado." };

  const valorMudou =
    (parsed.data.valorAtual ?? null) !==
    (existing.valorAtual !== null ? Number(String(existing.valorAtual)) : null);

  await prisma.ativoInvestimento.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      classe: parsed.data.classe,
      valorAtual: parsed.data.valorAtual ?? null,
      ...(valorMudou ? { dataAtualizacao: new Date() } : {}),
    },
  });

  revalidatePath("/investimentos");
  return { success: true };
}

export async function deleteAtivoAction(id: number): Promise<InvestimentoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.ativoInvestimento.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Ativo não encontrado." };

  await prisma.ativoInvestimento.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/investimentos");
  return { success: true };
}

export async function createLancamentoAction(
  ativoId: number,
  data: LancamentoFormData
): Promise<InvestimentoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = lancamentoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const ativo = await prisma.ativoInvestimento.findFirst({
    where: { id: ativoId, userId, isDeleted: false },
    select: { id: true },
  });
  if (!ativo) return { success: false, error: "Ativo não encontrado." };

  await prisma.lancamentoInvestimento.create({
    data: {
      userId,
      ativoId,
      tipo: parsed.data.tipo,
      valor: parsed.data.valor,
      data: toNoonUTC(parsed.data.data),
      observacao: parsed.data.observacao || null,
    },
  });

  revalidatePath("/investimentos");
  return { success: true };
}

export async function deleteLancamentoAction(id: number): Promise<InvestimentoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.lancamentoInvestimento.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Lançamento não encontrado." };

  await prisma.lancamentoInvestimento.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/investimentos");
  return { success: true };
}
