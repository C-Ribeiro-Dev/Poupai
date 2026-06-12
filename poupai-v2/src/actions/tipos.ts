"use server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tipoMovimentacaoSchema, type TipoMovimentacaoFormData } from "@/types/tipos";
import { checkNomeDuplicado } from "@/services/tipos";

export type TipoActionResult = { success: true } | { success: false; error: string };

export async function createTipoAction(
  data: TipoMovimentacaoFormData
): Promise<TipoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = tipoMovimentacaoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const isDuplicate = await checkNomeDuplicado(parsed.data.nome, userId);
  if (isDuplicate) {
    return {
      success: false,
      error: `Já existe um tipo com o nome "${parsed.data.nome}".`,
    };
  }

  await prisma.tipoMovimentacao.create({
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      isEntrada: parsed.data.isEntrada,
      userId,
    },
  });

  revalidatePath("/tipos");
  return { success: true };
}

export async function updateTipoAction(
  id: number,
  data: TipoMovimentacaoFormData
): Promise<TipoActionResult> {
  const userId = await getCurrentUserId();

  const parsed = tipoMovimentacaoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos." };
  }

  const existing = await prisma.tipoMovimentacao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Tipo não encontrado." };
  }

  const isDuplicate = await checkNomeDuplicado(parsed.data.nome, userId, id);
  if (isDuplicate) {
    return {
      success: false,
      error: `Já existe um tipo com o nome "${parsed.data.nome}".`,
    };
  }

  await prisma.tipoMovimentacao.update({
    where: { id },
    data: {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      isEntrada: parsed.data.isEntrada,
    },
  });

  revalidatePath("/tipos");
  return { success: true };
}

export async function deleteTipoAction(id: number): Promise<TipoActionResult> {
  const userId = await getCurrentUserId();

  const existing = await prisma.tipoMovimentacao.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) {
    return { success: false, error: "Tipo não encontrado." };
  }

  await prisma.tipoMovimentacao.update({
    where: { id },
    data: { isDeleted: true },
  });

  revalidatePath("/tipos");
  return { success: true };
}
