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

const TIPOS_PADRAO = [
  { nome: "Salário", isEntrada: true },
  { nome: "Freelance", isEntrada: true },
  { nome: "Outros+", isEntrada: true },
  { nome: "Cartão de Crédito", isEntrada: false },
  { nome: "Débito / Pix", isEntrada: false },
  { nome: "Dinheiro", isEntrada: false },
  { nome: "Outros-", isEntrada: false },
];

export async function seedTiposPadraoAction(): Promise<TipoActionResult> {
  const userId = await getCurrentUserId();

  const existentes = await prisma.tipoMovimentacao.findMany({
    where: { userId, isDeleted: false },
    select: { nome: true },
  });
  const existentesNomes = new Set(existentes.map((e) => e.nome));
  const novos = TIPOS_PADRAO.filter((t) => !existentesNomes.has(t.nome));

  if (novos.length === 0) {
    return { success: false, error: "Todos os tipos padrão já existem." };
  }

  await prisma.tipoMovimentacao.createMany({
    data: novos.map((t) => ({ ...t, userId })),
  });

  revalidatePath("/tipos");
  return { success: true };
}
