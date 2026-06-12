"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orcamentoSchema, type OrcamentoFormData } from "@/types/orcamentos";

export type OrcamentoActionResult = { success: true } | { success: false; error: string };

export async function createOrcamentoAction(
  data: OrcamentoFormData
): Promise<OrcamentoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = orcamentoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.orcamento.findFirst({
    where: { userId, categoria: parsed.data.categoria, isDeleted: false },
    select: { id: true },
  });
  if (existing) {
    return {
      success: false,
      error: `Já existe um orçamento para "${parsed.data.categoria}".`,
    };
  }

  await prisma.orcamento.create({
    data: { userId, categoria: parsed.data.categoria, valor: parsed.data.valor },
  });

  revalidatePath("/orcamento");
  revalidatePath("/");
  return { success: true };
}

export async function updateOrcamentoAction(
  id: number,
  data: OrcamentoFormData
): Promise<OrcamentoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = orcamentoSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: "Dados inválidos." };

  const existing = await prisma.orcamento.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Orçamento não encontrado." };

  const duplicate = await prisma.orcamento.findFirst({
    where: { userId, categoria: parsed.data.categoria, isDeleted: false, id: { not: id } },
    select: { id: true },
  });
  if (duplicate) {
    return {
      success: false,
      error: `Já existe um orçamento para "${parsed.data.categoria}".`,
    };
  }

  await prisma.orcamento.update({
    where: { id },
    data: { categoria: parsed.data.categoria, valor: parsed.data.valor },
  });

  revalidatePath("/orcamento");
  revalidatePath("/");
  return { success: true };
}

export async function deleteOrcamentoAction(id: number): Promise<OrcamentoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.orcamento.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { success: false, error: "Orçamento não encontrado." };

  await prisma.orcamento.update({ where: { id }, data: { isDeleted: true } });

  revalidatePath("/orcamento");
  revalidatePath("/");
  return { success: true };
}
